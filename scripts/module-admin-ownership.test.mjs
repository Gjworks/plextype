import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(root, "package.json"));
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");

function loader(stubs = {}) {
  const cache = new Map();
  function load(file) {
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} };
    cache.set(file, module);
    const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText;
    const localRequire = (name) => {
      if (Object.hasOwn(stubs, name)) return stubs[name];
      let target;
      if (name.startsWith("@/")) target = path.join(root, "src", name.slice(2));
      else if (name.startsWith("@utils/"))
        target = path.join(root, "src/core/utils", name.slice(7));
      else if (name.startsWith("."))
        target = path.resolve(path.dirname(file), name);
      else return require(name);
      const found = [".ts", ".tsx", "/index.ts", "/index.tsx"]
        .map((ext) => target + ext)
        .find(fs.existsSync);
      assert.ok(found, `Missing dependency: ${name} from ${file}`);
      return load(found);
    };
    vm.runInThisContext(`(function(require,module,exports){${code}\n})`, {
      filename: file,
    })(localRequire, module, module.exports);
    return module.exports;
  }
  return (name) => load(path.join(root, name));
}

for (const [owner, domain, key] of [
  ["attachment", "Upload", "upload"],
  ["user", "Auth", "auth"],
  ["notification", "Notification", "notification"],
]) {
  function context(admin) {
    const stored = new Map(),
      writes = [],
      cacheWrites = [];
    let queryCount = 0;
    const redis = {
      get: async (k) => stored.get(k) || null,
      set: async (...args) => {
        stored.set(args[0], args[1]);
        cacheWrites.push(args);
      },
      del: async (k) => stored.delete(k),
    };
    const load = loader({
      "@/modules/user/actions/user.action": {
        getUserSessionAction: async () => ({ data: { id: 1, isAdmin: admin } }),
      },
      "@utils/redis/redis": redis,
      "@/core/utils/redis/redis": redis,
      "@/core/utils/settings/settings.query": {
        getSettingsByKeysQuery: async () => {
          queryCount++;
          return [];
        },
        upsertSettingsQuery: async (seeds) => {
          writes.push(...seeds);
        },
      },
      "next/cache": { revalidatePath() {} },
    });
    const actions = load(`src/modules/${owner}/actions/settings.action.ts`);
    const runtime =
      domain === "Auth"
        ? load("src/modules/user/actions/auth-settings.ts")
        : actions;
    return {
      actions,
      runtime,
      writes,
      stored,
      cacheWrites,
      queryCount: () => queryCount,
    };
  }

  test(`${owner}: administrative reads and writes reject a non-admin before accessing settings`, async () => {
    const ctx = context(false);
    assert.equal(
      (await ctx.actions[`get${domain}SettingsAdminAction`]()).success,
      false,
    );
    assert.equal(
      (await ctx.actions[`update${domain}SettingsAdminAction`](new FormData()))
        .success,
      false,
    );
    assert.equal(ctx.queryCount(), 0);
    assert.equal(ctx.writes.length, 0);
  });

  test(`${owner}: runtime fallback, cache and save preserve existing policy keys`, async () => {
    const ctx = context(true);
    const getRuntime = ctx.runtime[`get${domain}SettingsRuntimeAction`];
    const defaults = await getRuntime();
    assert.ok(ctx.stored.has(`app:settings:${key}`));
    assert.equal(ctx.cacheWrites[0][2], "EX");
    assert.equal(ctx.cacheWrites[0][3], 86400);
    const count = ctx.queryCount();
    assert.deepEqual(await getRuntime(), defaults);
    assert.equal(ctx.queryCount(), count);
    const data = new FormData();
    for (const [name, value] of Object.entries(defaults)) {
      if (typeof value === "boolean") {
        if (value) data.set(name, "on");
      } else data.set(name, String(value));
    }
    assert.equal(
      (await ctx.actions[`update${domain}SettingsAdminAction`](data)).success,
      true,
    );
    assert.ok(ctx.writes.length > 0);
    assert.ok(ctx.writes.every((seed) => seed.key.startsWith(`${key}.`)));
    assert.deepEqual(
      JSON.parse(ctx.stored.get(`app:settings:${key}`)),
      defaults,
    );
  });
}

test("registry: domain contributions merge into one ordered group without mutating source registries", () => {
  const { buildExtensionRegistry } = loader()("src/core/registry/build.ts");
  const first = {
    modules: [
      {
        admin: {
          menu: {
            id: "content",
            label: "Content",
            order: 40,
            items: [{ label: "Comments", href: "/comments", order: 20 }],
          },
        },
      },
    ],
  };
  const second = {
    modules: [
      {
        admin: {
          menu: {
            id: "content",
            label: "Content",
            order: 40,
            items: [{ label: "Documents", href: "/documents", order: 10 }],
          },
        },
      },
    ],
  };
  const snapshot = JSON.stringify(first);
  const menus = buildExtensionRegistry(first, second).adminMenus;
  assert.equal(menus.length, 1);
  assert.deepEqual(
    menus[0].items.map((item) => item.href),
    ["/documents", "/comments"],
  );
  assert.equal(JSON.stringify(first), snapshot);
  assert.equal(buildExtensionRegistry(second).adminMenus[0].items.length, 1);
});

test("feature modules do not import the admin module", () => {
  function walk(dir) {
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .flatMap((e) =>
        e.isDirectory()
          ? walk(path.join(dir, e.name))
          : /\.tsx?$/.test(e.name)
            ? [path.join(dir, e.name)]
            : [],
      );
  }
  const owners = fs.readdirSync(path.join(root, "src/modules"), { withFileTypes: true })
    .filter(entry => entry.isDirectory() && entry.name !== "admin")
    .map(entry => entry.name);
  for (const owner of owners) {
    for (const file of walk(path.join(root, "src/modules", owner)))
      assert.doesNotMatch(
        fs.readFileSync(file, "utf8"),
        /(?:@\/modules\/admin|@modules\/admin)/,
        file,
      );
  }
});

test("existing administrative URLs use domain-owned screens", () => {
  for (const [url, owner] of [
    ["content/documents", "document"],
    ["content/comments", "comment"],
    ["content/attachments", "attachment"],
    ["settings/upload", "attachment"],
    ["settings/auth", "user"],
    ["settings/notification", "notification"],
  ]) {
    const source = read(`src/app/(modules)/admin/${url}/page.tsx`);
    assert.ok(source.includes(`@/modules/${owner}/admin/`));
    assert.ok(!source.includes("@/modules/admin"));
  }
});

for (const [owner, domain, plural] of [
  ["document", "Document", "Documents"],
  ["comment", "Comment", "Comments"],
  ["attachment", "Attachment", "Attachments"],
]) {
  test(`${owner}: administrative content list and delete require administrator privileges`, async () => {
    let touched = 0;
    const load = loader({
      "@/modules/user/actions/user.action": {
        getUserSessionAction: async () => ({ data: { id: 1, isAdmin: false } }),
      },
      "@/modules/notification/actions/admin-content.action": {
        notifyDeletedOwnerAction: async () => {
          touched++;
        },
      },
      [`./${owner}.action`]: {
        [domain === "Attachment"
          ? "deleteAttachmentAction"
          : `remove${domain}Action`]: async () => {
          touched++;
        },
      },
      "./admin-content.query": new Proxy(
        {},
        {
          get: () => async () => {
            touched++;
          },
        },
      ),
      "next/cache": { revalidatePath() {} },
    });
    const actions = load(
      `src/modules/${owner}/actions/admin-content.action.ts`,
    );
    assert.equal(
      (await actions[`getRecent${plural}AdminAction`]()).success,
      false,
    );
    assert.equal(
      (await actions[`remove${domain}AdminAction`](1)).success,
      false,
    );
    assert.equal(touched, 0);
  });
}

test("admin content notification cannot impersonate an administrator", async () => {
  let notifications = 0;
  const load = loader({
    "@/core/utils/auth/adminSession": {
      getAdminSession: async () => ({ id: 7 }),
    },
    "./notification.action": {
      dispatchNotificationAction: async () => {
        notifications++;
      },
    },
  });
  const { notifyDeletedOwnerAction } = load(
    "src/modules/notification/actions/admin-content.action.ts",
  );
  await notifyDeletedOwnerAction({
    userId: 9,
    actorId: 3,
    title: "Removed",
    content: "",
    contentType: "document",
  });
  assert.equal(notifications, 0);
  await notifyDeletedOwnerAction({
    userId: 9,
    actorId: 7,
    title: "Removed",
    content: "",
    contentType: "document",
  });
  assert.equal(notifications, 1);
});

test("domain menu contributions keep existing settings/content navigation and work without admin", () => {
  const { buildExtensionRegistry } = loader()("src/core/registry/build.ts");
  function registry(owner) {
    const module = { exports: {} };
    const file = `src/modules/${owner}/registry.tsx`;
    const code = ts.transpileModule(read(file), {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText;
    const define = (config) => config;
    const localRequire = (name) =>
      name === "@/core/registry/define"
        ? {
            defineModule: define,
            defineUserSkin: define,
            defineAdminLayout: define,
          }
        : name === "react/jsx-runtime"
          ? require(name)
          : new Proxy({}, { get: () => () => null });
    vm.runInThisContext(`(function(require,module,exports){${code}\n})`)(
      localRequire,
      module,
      module.exports,
    );
    return module.exports[`${owner}Module`];
  }
  const domains = [
    "document",
    "comment",
    "attachment",
    "user",
    "notification",
  ].map(registry);
  const admin = registry("admin");
  const menus = buildExtensionRegistry({
    modules: [admin, ...domains],
  }).adminMenus;
  assert.deepEqual(
    menus.find((m) => m.id === "content").items.map((i) => i.href),
    [
      "/admin/content/documents",
      "/admin/content/comments",
      "/admin/content/attachments",
      "/admin/content/reports",
    ],
  );
  assert.deepEqual(
    menus.find((m) => m.id === "settings").items.map((i) => i.href),
    [
      "/admin/settings",
      "/admin/settings/seo",
      "/admin/settings/search",
      "/admin/settings/auth",
      "/admin/settings/upload",
      "/admin/settings/notification",
      "/admin/settings/mail",
    ],
  );
  const withoutAdmin = buildExtensionRegistry({ modules: domains }).adminMenus;
  assert.equal(withoutAdmin.find((m) => m.id === "content").items.length, 3);
  assert.equal(withoutAdmin.find((m) => m.id === "settings").items.length, 3);
});
