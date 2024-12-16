'use client';

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
  const markersRef = useRef({});

  useEffect(() => {
    // Inizializzazione della mappa
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        center: [41.9028, 12.4964], // Centro Italia
        zoom: 6,
        minZoom: 4,
        maxZoom: 18,
        scrollWheelZoom: true,
        zoomControl: true
      });

      // Aggiunta del layer della mappa
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
      }).addTo(mapInstanceRef.current);

      // Aggiunta controlli zoom in posizione personalizzata
      L.control.zoom({
        position: 'bottomright'
      }).addTo(mapInstanceRef.current);
    }

    // Funzione per creare l'icona personalizzata del marker
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
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              width: 8px;
              height: 8px;
              background-color: white;
              border-radius: 50%;
            "></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12]
      });
    };

    // Funzione per creare il contenuto del popup
    const createPopupContent = (station) => {
      return `
        <div class="station-popup">
          <div style="border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 8px;">
            <h3 style="font-weight: bold; font-size: 16px; margin: 0 0 4px 0;">${station.owner}</h3>
            <p style="margin: 0; color: #666;">${cleanDisplayAddress(station.location)}</p>
          </div>
          
          <div style="font-size: 14px;">
            ${station.power ? `
              <p style="margin: 4px 0;">
                <strong>Potenza:</strong> ${station.power} kW
              </p>
            ` : ''}
            
            ${station.connectorType ? `
              <p style="margin: 4px 0;">
                <strong>Connettore:</strong> ${station.connectorType}
              </p>
            ` : ''}
            
            ${station.currentType ? `
              <p style="margin: 4px 0;">
                <strong>Corrente:</strong> ${station.currentType}
              </p>
            ` : ''}
            
            ${station.additionalInfo ? `
              <p style="margin: 4px 0;">
                <strong>Info aggiuntive:</strong> ${station.additionalInfo}
              </p>
            ` : ''}
            
            <p style="margin: 4px 0;">
              <strong>Stato:</strong> 
              <span style="color: ${station.available ? '#22c55e' : '#ef4444'}">
                ${station.available ? 'Disponibile' : 'In uso'}
              </span>
            </p>
            
            ${station.rating ? `
              <p style="margin: 4px 0;">
                <strong>Valutazione:</strong> ${station.rating.toFixed(1)}/5.0
              </p>
            ` : ''}
          </div>
        </div>
      `;
    };

    // Aggiornamento dei marker
    stations.forEach(station => {
      if (station.latitude && station.longitude) {
        // Rimozione del vecchio marker se esiste
        if (markersRef.current[station.id]) {
          mapInstanceRef.current.removeLayer(markersRef.current[station.id]);
        }

        // Creazione del nuovo marker
        const markerColor = station.available ? '#22c55e' : '#ef4444';
        const marker = L.marker([station.latitude, station.longitude], {
          icon: createCustomIcon(markerColor)
        });

        // Aggiunta del popup
        const popup = L.popup({
          maxWidth: 300,
          minWidth: 250,
          className: 'custom-popup'
        }).setContent(createPopupContent(station));

        marker.bindPopup(popup);

        // Aggiunta del marker alla mappa
        marker.addTo(mapInstanceRef.current);
        markersRef.current[station.id] = marker;

        // Eventi del marker
        marker.on('mouseover', function(e) {
          this.openPopup();
        });
      }
    });

    // Cleanup dei marker non più presenti
    Object.keys(markersRef.current).forEach(id => {
      if (!stations.find(s => s.id === id)) {
        mapInstanceRef.current.removeLayer(markersRef.current[id]);
        delete markersRef.current[id];
      }
    });

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        Object.values(markersRef.current).forEach(marker => {
          mapInstanceRef.current.removeLayer(marker);
        });
        markersRef.current = {};
      }
    };
  }, [stations]);

  return (
    <div 
      ref={mapRef} 
      style={{ 
        height: "400px", 
        width: "100%", 
        borderRadius: "0.5rem",
        position: "relative",
        zIndex: 0
      }} 
    />
  );
};

export default MapComponent;

