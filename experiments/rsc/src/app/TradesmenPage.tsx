import { lowerCase } from "lodash";
import { db } from "../db";
import NavBar from "./components/NavBar";

export default async function TradesmenPage(props: { profession: string }) {
  const tradesmen = await db
    .selectFrom("Tradesman")
    .selectAll()
    .where("profession", "=", props.profession)
    .execute();

  if (tradesmen.length === 0) {
    return <div>No tradesmen found for {props.profession}</div>;
  }

  return (
    <div className="flex flex-col items-center justify-start h-screen w-full mx-auto">
      <NavBar to="/professions" />
      <div className="flex flex-col items-center justify-center max-w-md mx-auto">
        <h1 className="text-3xl text-gray-800 font-bold text-center mb-4">
          We have the following {lowerCase(props.profession)}'s in our directory{" "}
        </h1>
      <div className="flex flex-col items-center justify-center w-full">
        {tradesmen.map((tradesman) => (
          <a
            key={tradesman.id}
            className="text-sm font-bold text-gray-600 hover:text-gray-800 bg-gray-100 p-4 rounded-md mb-2 w-full flex items-center justify-start gap-2"
            href={`/tradesman/${tradesman.id}`}
          >
            <img
              src={`http://localhost:2332/bucket/${tradesman.profilePicture}` ?? ""}
              alt={tradesman.name}
              className="w-10 h-10 rounded-full bg-gray-200"
              />
              {tradesman.name}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
