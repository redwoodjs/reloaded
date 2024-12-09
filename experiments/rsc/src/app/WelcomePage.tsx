export default function WelcomePage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen max-w-md mx-auto">
      <h1 className="text-3xl text-gray-800 font-bold text-center">Welcome to The Valley Directory!</h1>
      {/* <img src="/assets/logo.webp" alt="The Valley" className="w-full h-auto" /> */}
      <p className="text-md text-gray-600 my-4">
        The Valley Directory is a directory of tradesmen in the Riebeek Valley.
        We want to make it easier for you to find the right tradesman for your
        needs.
      </p>
      <a href="/professions" className="text-sm text-center bg-blue-500 p-4 rounded-md text-white font-bold w-full mb-2" >
        Click here to see available tradesmen
      </a>
      <a href="/add-tradesman" className="text-sm text-center bg-gray-800 p-4 rounded-md text-white font-bold w-full">
        I'm a tradesman, list me please
      </a>
    </div>
  );
}
