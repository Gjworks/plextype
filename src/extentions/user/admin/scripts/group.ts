export async function getUserDetail(id: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_DEFAULT_URL}/api/admin/user/${id}`,
    {
      cache: "no-store",
      credentials: "include",
    },
  );
  if (!res.ok) return null;
  return res.json();
}

export async function getAllGroups() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_DEFAULT_URL}/api/admin/user/groups`,
    {
      cache: "no-store",
    },
  );

  console.log(res);
  if (!res.ok) return [];
  return res.json();
}
