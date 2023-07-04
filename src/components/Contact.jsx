import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

import { toast } from "react-toastify";

const Contact = ({ userRef, listing }) => {
  const [landlord, setLandlord] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const getLandlord = async () => {
      const docRef = doc(db, "users", userRef);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setLandlord(docSnap.data());
      } else {
        toast.error("Could not find a landlord.");
      }
    };
    getLandlord();
  }, [userRef]);

  return (
    <>
      <div className="flex flex-col w-full">
        <p>
          Contact {landlord !== null && landlord.name} for the{" "}
          {listing.name.toLowerCase()}.
        </p>
        <div className="mt-3 mb-6">
          <textarea
            name="message"
            id="message"
            rows="2"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-4 py-2 text-xl text-gray-700 bg-white border border-gray-300 rounded transition duration-150 ease-in-out focus:text-gray-700 focus:bg-white focus:border-slate-600"
          ></textarea>
        </div>
        <a
          href={`mailto:${landlord !== null && landlord.email}?Subject=${
            listing.name
          }&body=${message}`}
        >
          <button
            className="px-7 py-3 bg-blue-600 text-white rounded text-sm uppercase shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out w-full text-center mb-6"
            type="button"
          >
            Send message
          </button>
        </a>
      </div>
    </>
  );
};

export default Contact;
