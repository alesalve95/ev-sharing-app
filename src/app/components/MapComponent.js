import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

// Funzione per pulire l'indirizzo da undefined
const cleanDisplayAddress = (address) => {
  if (!address) return '';
  return address.replace(/,?\s*undefined(\s+undefined)?$/g, '');
};

const MapComponent = ({ stations = [] }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([42.8333, 12.8333], 6);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);
    }

    const createCustomIcon = (color) => {
      return L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div style="
            background-color: ${color};
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 0 4px rgba(0,0,0,0.5);
          "></div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12]
      });
    };

    mapInstanceRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapInstanceRef.current.removeLayer(layer);
      }
    });

    stations.forEach(station => {
      if (station.latitude && station.longitude) {
        const markerColor = station.available ? '#22c55e' : '#ef4444';
        const marker = L.marker([station.latitude, station.longitude], {
          icon: createCustomIcon(markerColor)
        }).addTo(mapInstanceRef.current);

        // Contenuto del popup aggiornato per includere le informazioni aggiuntive
        const popupContent = `
          <div>
            <h3 style="font-weight: bold;">${station.owner}</h3>
            <p style="margin: 5px 0">${cleanDisplayAddress(station.location)}</p>
            ${station.power ? `<p style="margin: 5px 0"><strong>Potenza:</strong> ${station.power} kW</p>` : ''}
            ${station.connectorType ? `<p style="margin: 5px 0"><strong>Connettore:</strong> ${station.connectorType}</p>` : ''}
            ${station.currentType ? `<p style="margin: 5px 0"><strong>Corrente:</strong> ${station.currentType}</p>` : ''}
            ${station.additionalInfo ? `<p style="margin: 5px 0"><strong>Info aggiuntive:</strong> ${station.additionalInfo}</p>` : ''}
            <p style="margin: 5px 0"><strong>Stato:</strong> ${station.available ? 'Disponibile' : 'In uso'}</p>
          </div>
        `;

        marker.bindPopup(popupContent);
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [stations]);

  return <div ref={mapRef} style={{ height: "400px", width: "100%", borderRadius: "0.5rem" }} />;
};

export default MapComponent;

