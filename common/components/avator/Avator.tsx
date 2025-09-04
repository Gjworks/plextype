"use client";

const Avator = ({ username, isLoggedIn }) => {
  console.log(username);
  console.log(isLoggedIn);
  return (
    <div className="flex gap-2">
      <div className="flex items-center">
        <div className="relative dark:bg-dark-400 block h-5 w-5 rounded-full bg-gray-600/60">
          {isLoggedIn && (
            <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-400 rounded-full"></div>
          )}
        </div>
      </div>
      {isLoggedIn && (
        <div className="hidden lg:flex items-center flex-1 gap-2">
          <div>
            <div className="text-left dark:text-dark-100 text-xs font-medium text-gray-800">
              {username}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Avator;
