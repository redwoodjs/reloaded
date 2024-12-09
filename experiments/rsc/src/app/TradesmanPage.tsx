import { db } from "../db";
import NavBar from "./components/NavBar";

export default async function TradesmanPage(props: { id: number }) {
  const tradesman = await db
    .selectFrom("Tradesman")
    .selectAll()
    .where("id", "=", props.id)
    .executeTakeFirst();


  return (
    <div className="flex flex-col items-center justify-start h-screen w-full mx-auto">
      <NavBar to={`/tradesmen/${tradesman?.profession}`} />
      <div className="flex flex-col items-center justify-center max-w-md w-full mx-auto">
        <div className="w-full bg-white border border-gray-200 rounded-lg shadow p-4 flex flex-col items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-gray-200 mb-4">
            <img
              src={`http://localhost:2332/bucket/${tradesman?.profilePicture}`}
              alt={tradesman?.name}
              className="w-full h-full object-cover"
            />
          </div>
          <h5 className="mb-1 text-xl font-medium text-gray-900">
            {tradesman?.name}
          </h5>
          <span className="text-sm text-gray-500">{tradesman?.profession}</span>
          <a
            href={`tel:${tradesman?.cellnumber}`}
            className="text-sm text-gray-500"
          >
            {tradesman?.cellnumber
              .replace("+27", "0")
              .replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3")}
          </a>
        </div>
      </div>
    </div>
  );
}
