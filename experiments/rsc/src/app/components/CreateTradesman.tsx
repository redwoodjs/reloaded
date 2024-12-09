import { createTradesman } from "../createTradesman";
const professions = ["Electrician", "Plumber", "Carpenter", "Painter", "Welder"];

export default function CreateTradesman() {
  return (
    <div>
      <form action={createTradesman}>
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          required
          className="w-full p-2 rounded-md border-[1px] border-gray-300 mb-2"
        />
        <input type="file" name="profilePicture" className="w-full p-2 rounded-md border-[1px] border-gray-300 mb-2" />
        <input
          type="text"
          name="cellnumber"
          placeholder="Cell Number (+1234567890)"
          pattern="^\+[1-9]{1}[0-9]{3,14}$"
          required
          className="w-full p-2 rounded-md border-[1px] border-gray-300 mb-2"
        />
        <select name="profession" className="w-full p-2 rounded-md border-[1px] border-gray-300 mb-2">
          {professions.map((profession, index) => (
            <option key={index} value={profession}>
              {profession}
            </option>
          ))}
        </select>
        <button
          className="w-full p-2 rounded-md bg-blue-500 text-white"
          type="submit"
        >
          Save Tradesman
        </button>
      </form>
    </div>
  );
}
