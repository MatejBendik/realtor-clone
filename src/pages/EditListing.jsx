import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Spinner from "../components/Spinner";
import {
  serverTimestamp,
  addDoc,
  updateDoc,
  getDoc,
  doc,
  collection,
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";

import { getAuth } from "firebase/auth";

import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";
const CreateListing = () => {
  const auth = getAuth();
  const navigate = useNavigate();

  const [geolocationEnabled, setGeolocationEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [listing, setListing] = useState(null);

  const [formData, setFormData] = useState({
    type: "rent",
    name: "",
    bedrooms: 1,
    bathrooms: 1,
    parking: false,
    furnished: false,
    address: "",
    description: "",
    offer: false,
    regularPrice: 0,
    discountedPrice: 0,
    latitude: 0,
    longitude: 0,
    images: {},
  });

  const {
    type,
    name,
    bedrooms,
    bathrooms,
    parking,
    furnished,
    address,
    description,
    offer,
    regularPrice,
    discountedPrice,
    latitude,
    longitude,
    images,
  } = formData;

  // grab listingId from url
  const params = useParams();

  useEffect(() => {
    if (listing && listing.userRef !== auth.currentUser.uid) {
      toast.error("You can't edit this listing!");
      navigate("/");
    }
  }, [auth.currentUser.uid, listing, navigate]);

  useEffect(() => {
    setLoading(true);

    const fetchListing = async () => {
      const docRef = doc(db, "listings", params.listingId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setListing(docSnap.data());
        setFormData({ ...docSnap.data() });
        setLoading(false);
      } else {
        navigate("/");
        toast.error("Listing does not exist!");
      }
    };
    fetchListing();
  }, [navigate, params.listingId]);

  const handleChange = (e) => {
    let boolean = null;
    if (e.target.value === "true") {
      boolean = true;
    }
    if (e.target.value === "false") {
      boolean = false;
    }

    // files
    if (e.target.files) {
      setFormData({ ...formData, images: e.target.files });
    }

    // text/boolean/number
    if (!e.target.files) {
      setFormData({ ...formData, [e.target.id]: boolean ?? e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // + converts string to number
    if (+discountedPrice >= +regularPrice) {
      setLoading(false);
      toast.error("Discounted price must be lower than regular price!");
      return;
    }

    if (images.length > 6) {
      setLoading(false);
      toast.error("Maximum 6 images allowed!");
      return;
    }

    let geolocation = {};
    let location;

    if (!geolocationEnabled) {
      geolocation.lat = latitude;
      geolocation.lng = longitude;
    }

    const storeImage = async (image) => {
      return new Promise((resolve, reject) => {
        const storage = getStorage();
        const fileName = `${auth.currentUser.uid}-${image.name}-${uuidv4()}`;
        const storageRef = ref(storage, `images/${fileName}`);
        const uploadTask = uploadBytesResumable(storageRef, image);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            // Observe state change events such as progress, pause, and resume
            // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log("Upload is " + progress + "% done");
            switch (snapshot.state) {
              case "paused":
                console.log("Upload is paused");
                break;
              case "running":
                console.log("Upload is running");
                break;
            }
          },
          (error) => {
            // Handle unsuccessful uploads
            reject(error);
          },
          () => {
            // Handle successful uploads on complete
            // For instance, get the download URL: https://firebasestorage.googleapis.com/...
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
              resolve(downloadURL);
            });
          }
        );
      });
    };

    const imgUrls = await Promise.all(
      [...images].map(async (image) => storeImage(image))
    ).catch((error) => {
      setLoading(false);
      toast.error("Images not uploaded!");
    });

    const formDataCopy = {
      ...formData,
      imgUrls,
      geolocation,
      timestamp: serverTimestamp(),
      userRef: auth.currentUser.uid,
    };

    delete formDataCopy.images;
    !formDataCopy.offer && delete formDataCopy.discountedPrice;
    delete formDataCopy.latitude;
    delete formDataCopy.longitude;

    const docRef = doc(db, "listings", params.listingId);
    await updateDoc(docRef, formDataCopy);

    setLoading(false);
    toast.success("Listing edited!");
    navigate(`/category/${formDataCopy.type}/${docRef.id}`);
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <main className="max-w-md px-2 mx-auto">
      <h1 className="text-3xl text-center mt-6 font-bold">Edit Listing</h1>
      <form onSubmit={handleSubmit}>
        <p className="text-lg mt-6 font-semibold">Sell / Rent</p>
        <div className="flex justify-between mt-2">
          <button
            type="button"
            id="type"
            value="sale"
            onClick={handleChange}
            className={`mr-3 px-7 py-3 font-medium text-sm uppercase shadow-md rounded hover:shadow-lg focus:shadow-lg active:shadow-lg transition ease-in-out duration-150 w-full 
                        ${
                          type === "rent"
                            ? "bg-white text-black"
                            : "bg-slate-600 text-white"
                        }`}
          >
            Sell
          </button>
          <button
            type="button"
            id="type"
            value="rent"
            onClick={handleChange}
            className={`ml-3 px-7 py-3 font-medium text-sm uppercase shadow-md rounded hover:shadow-lg focus:shadow-lg active:shadow-lg transition ease-in-out duration-150 w-full 
                        ${
                          type === "sale"
                            ? "bg-white text-black"
                            : "bg-slate-600 text-white"
                        }`}
          >
            Rent
          </button>
        </div>
        <p className="text-lg mt-6 font-semibold">Name</p>
        <input
          type="text"
          id="name"
          value={name}
          onChange={handleChange}
          placeholder="Name"
          maxLength="32"
          minLength="10"
          required
          className="w-full px-4 py-2 text-xl text-gray-700 bg-white border border-gray-300 rounded transition duration-150 ease-in-out focus:text-gray-700 focus:bg-white focus:border-slate-600 mb-6"
        />
        <div className="flex space-x-6 mb-6">
          <div>
            <p className="text-lg mt-6 font-semibold">Beds</p>
            <input
              type="number"
              id="bedrooms"
              value={bedrooms}
              onChange={handleChange}
              min="1"
              max="50"
              required
              className="w-full text-center px-4 py-2 text-xl text-gray-700 bg-white border border-gray-300 rounded transition duration-150 ease-in-out focus:text-gray-700 focus:bg-white focus:border-slate-600 mb-6"
            />
          </div>
          <div>
            <p className="text-lg mt-6 font-semibold">Baths</p>
            <input
              type="number"
              id="bathrooms"
              value={bathrooms}
              onChange={handleChange}
              min="1"
              max="50"
              required
              className="w-full text-center px-4 py-2 text-xl text-gray-700 bg-white border border-gray-300 rounded transition duration-150 ease-in-out focus:text-gray-700 focus:bg-white focus:border-slate-600 mb-6"
            />
          </div>
        </div>
        <p className="text-lg mt-6 font-semibold">Parking spot</p>
        <div className="flex justify-between mt-2">
          <button
            type="button"
            id="parking"
            value={true}
            onClick={handleChange}
            className={`mr-3 px-7 py-3 font-medium text-sm uppercase shadow-md rounded hover:shadow-lg focus:shadow-lg active:shadow-lg transition ease-in-out duration-150 w-full 
                        ${
                          !parking
                            ? "bg-white text-black"
                            : "bg-slate-600 text-white"
                        }`}
          >
            Yes
          </button>
          <button
            type="button"
            id="parking"
            value={false}
            onClick={handleChange}
            className={`ml-3 px-7 py-3 font-medium text-sm uppercase shadow-md rounded hover:shadow-lg focus:shadow-lg active:shadow-lg transition ease-in-out duration-150 w-full 
                        ${
                          parking
                            ? "bg-white text-black"
                            : "bg-slate-600 text-white"
                        }`}
          >
            No
          </button>
        </div>
        <p className="text-lg mt-6 font-semibold">furnished</p>
        <div className="flex justify-between mt-2">
          <button
            type="button"
            id="furnished"
            value={true}
            onClick={handleChange}
            className={`mr-3 px-7 py-3 font-medium text-sm uppercase shadow-md rounded hover:shadow-lg focus:shadow-lg active:shadow-lg transition ease-in-out duration-150 w-full 
                        ${
                          !furnished
                            ? "bg-white text-black"
                            : "bg-slate-600 text-white"
                        }`}
          >
            Yes
          </button>
          <button
            type="button"
            id="furnished"
            value={false}
            onClick={handleChange}
            className={`ml-3 px-7 py-3 font-medium text-sm uppercase shadow-md rounded hover:shadow-lg focus:shadow-lg active:shadow-lg transition ease-in-out duration-150 w-full 
                        ${
                          furnished
                            ? "bg-white text-black"
                            : "bg-slate-600 text-white"
                        }`}
          >
            No
          </button>
        </div>

        <p className="text-lg mt-6 font-semibold">Address</p>
        <textarea
          type="text"
          id="address"
          value={address}
          onChange={handleChange}
          placeholder="Address"
          required
          className="w-full px-4 py-2 text-xl text-gray-700 bg-white border border-gray-300 rounded transition duration-150 ease-in-out focus:text-gray-700 focus:bg-white focus:border-slate-600 mb-6"
        />
        {!geolocationEnabled && (
          <div className="flex space-x-6 justify-start mb-6">
            <div>
              <p className="text-lg font-semibold">Latitude</p>
              <input
                type="number"
                id="latitude"
                value={latitude}
                onChange={handleChange}
                placeholder="Latitude"
                required
                min="-90"
                max="90"
                className="text-center w-full px-4 py-2 text-xl text-gray-700 bg-white border border-gray-300 rounded transition duration-150 ease-in-out focus:text-gray-700 focus:bg-white focus:border-slate-600 mb-6"
              />
            </div>
            <div>
              <p className="text-lg font-semibold">longitude</p>
              <input
                type="number"
                id="longitude"
                value={longitude}
                onChange={handleChange}
                placeholder="Latitude"
                required
                min="-180"
                max="180"
                className="text-center w-full px-4 py-2 text-xl text-gray-700 bg-white border border-gray-300 rounded transition duration-150 ease-in-out focus:text-gray-700 focus:bg-white focus:border-slate-600 mb-6"
              />
            </div>
          </div>
        )}

        <p className="text-lg font-semibold">Description</p>
        <textarea
          type="text"
          id="description"
          value={description}
          onChange={handleChange}
          placeholder="Description"
          required
          className="w-full px-4 py-2 text-xl text-gray-700 bg-white border border-gray-300 rounded transition duration-150 ease-in-out focus:text-gray-700 focus:bg-white focus:border-slate-600 mb-6"
        />

        <p className="text-lg font-semibold">Offer</p>
        <div className="flex justify-between mt-2 mb-6">
          <button
            type="button"
            id="offer"
            value={true}
            onClick={handleChange}
            className={`mr-3 px-7 py-3 font-medium text-sm uppercase shadow-md rounded hover:shadow-lg focus:shadow-lg active:shadow-lg transition ease-in-out duration-150 w-full 
                        ${
                          !offer
                            ? "bg-white text-black"
                            : "bg-slate-600 text-white"
                        }`}
          >
            Yes
          </button>
          <button
            type="button"
            id="offer"
            value={false}
            onClick={handleChange}
            className={`ml-3 px-7 py-3 font-medium text-sm uppercase shadow-md rounded hover:shadow-lg focus:shadow-lg active:shadow-lg transition ease-in-out duration-150 w-full 
                        ${
                          offer
                            ? "bg-white text-black"
                            : "bg-slate-600 text-white"
                        }`}
          >
            No
          </button>
        </div>
        <div className="flex items-center mb-6">
          <div>
            <p className="text-lg font-semibold">Regular price</p>
            <div className="flex w-full justify-center items-center space-x-6">
              <input
                type="number"
                id="regularPrice"
                value={regularPrice}
                onChange={handleChange}
                min="50"
                max="400000000"
                required
                className="w-full text-center px-4 py-2 text-xl text-gray-700 bg-white border border-gray-300 rounded transition duration-150 ease-in-out focus:text-gray-700 focus:bg-white focus:border-slate-600"
              />
              {type === "rent" && (
                <div>
                  <p className="text-md w-full whitespace-nowrap">$ / Month</p>
                </div>
              )}
            </div>
          </div>
        </div>
        {offer && (
          <div className="flex items-center mb-6">
            <div>
              <p className="text-lg font-semibold">Discounted price</p>
              <div className="flex w-full justify-center items-center space-x-6">
                <input
                  type="number"
                  id="discountedPrice"
                  value={discountedPrice}
                  onChange={handleChange}
                  min="50"
                  max="400000000"
                  required={offer}
                  className="w-full text-center px-4 py-2 text-xl text-gray-700 bg-white border border-gray-300 rounded transition duration-150 ease-in-out focus:text-gray-700 focus:bg-white focus:border-slate-600"
                />
                {type === "rent" && (
                  <div>
                    <p className="text-md w-full whitespace-nowrap">
                      $ / Month
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        <div className="mb-6">
          <p className="text-lg font-semibold">Images</p>
          <p className="text-gray-600">
            The first image will be the cover (max 6)
          </p>
          <input
            type="file"
            id="images"
            onChange={handleChange}
            accept=".jpg,.png,.jpeg"
            multiple
            required
            className="w-full px-3 py-1.5 text-gray-700 bg-white border border-gray-300 rounded transition duration-150 ease-in-out focus:bg-white focus:border-slate-600"
          />
        </div>
        <button
          type="submit"
          className="mb-6 w-full px-7 py-3 bg-blue-600 text-white font-medium text-sm uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out"
        >
          Edit Listing
        </button>
      </form>
    </main>
  );
};

export default CreateListing;
