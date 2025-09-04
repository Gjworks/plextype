"use client";

import UserDelete from "@/extentions/user/templates/default/delete";

const Page = (props: any) => {
  return (
    <>
      <div className="max-w-screen-md mx-auto px-3 pt-10 pb-20">
        <UserDelete />
      </div>
    </>
  );
};

export default Page;
