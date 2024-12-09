export default function NavBar(props: { to: string }) {
  return (
    <div className="bg-white border border-gray-200 shadow p-4 w-full mb-4">
      <div className="flex flex-row items-center justify-between  max-w-md mx-auto">
        <a href={props.to} className="text-sm text-gray-500 flex flex-row items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="40px"
            viewBox="0 -960 960 960"
            width="40px"
            fill="#ff"
          >
            <path d="M400-80 0-480l400-400 61 61.67L122.67-480 461-141.67 400-80Z" />
          </svg>
          <span className="text-sm text-gray-500">Back</span>
        </a>
      </div>
    </div>
  );
}
