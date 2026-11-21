import { createContext, useContext, useEffect, useState } from 'react';

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const [coords, setCoords] = useState(null); // { lat, lng }
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) { setError('Geolocation unsupported'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setError('Location permission denied — defaulting to Kolkata'),
      { timeout: 8000 }
    );
  }, []);

  const effective = coords || { lat: 22.5735, lng: 88.4335 }; // Salt Lake, Kolkata fallback
  return (
    <LocationContext.Provider value={{ coords: effective, rawCoords: coords, error }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  return useContext(LocationContext);
}
