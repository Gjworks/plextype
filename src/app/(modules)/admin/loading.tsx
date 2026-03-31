export default function Loading() {
  return (
    <>
      <div className="text-white">Loading...</div>
      <div className="flex justify-center p-10">
        <div className="relative w-8 h-8">
          <div className="w-8 h-8 rounded-full absolute border-2 border-solid border-dark-600"></div>
          <div className="w-8 h-8 rounded-full animate-spin absolute border-2 border-solid border-primary-400 border-t-transparent"></div>
        </div>
      </div>
    </>
  )
}
