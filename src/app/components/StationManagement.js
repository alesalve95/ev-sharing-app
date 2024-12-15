'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Star, Search, Plus } from 'lucide-react';

// Funzione per pulire l'indirizzo da undefined
const cleanDisplayAddress = (address) => {
  if (!address) return '';
  return address.replace(/,?\s*undefined(\s+undefined)?$/g, '');
};

// Funzione di debounce
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Funzione di formattazione indirizzo
const formatAddressComponents = (address) => {
  if (!address) return '';
  const components = [];
  const street = address.road || address.street || '';
  const houseNumber = address.house_number || '';
  
  if (street || houseNumber) {
    components.push([street, houseNumber].filter(Boolean).join(' '));
  }
  
  const city = address.city || address.town || address.village || '';
  if (city) {
    components.push(city);
  }
  
  const postcode = address.postcode || '';
  if (postcode) {
    if (!components[components.length - 1]?.includes(postcode)) {
      components[components.length - 1] = `${components[components.length - 1]} ${postcode}`;
    }
  }
  
  const province = address.state || address.county || '';
  if (province && !city?.includes(province)) {
    components.push(province);
  }
  
  const country = address.country || '';
  if (country) {
    components.push(country);
  }
  
  return components
    .filter(Boolean)
    .filter(component => !component.includes('undefined'))
    .join(', ');
};

// Componente per gli errori dell'API
const AddressError = ({ message }) => (
  <Alert className="mt-2">
    <AlertDescription>
      {message || "Impossibile caricare i suggerimenti. Verifica la tua connessione o riprova più tardi."}
    </AlertDescription>
  </Alert>
);

// Componente per le stelle di valutazione
const RatingStars = ({ rating, onRatingChange }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        size={20}
        className={`cursor-pointer ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
        onClick={() => onRatingChange?.(star)}
      />
    ))}
  </div>
);

const StationManagement = ({
  user,
  stations = [],
  onAddStation,
  onStartCharging,
  onAddReview,
  searchQuery = "",
  setSearchQuery,
  onToggleStationStatus,
  onDeleteStation
}) => {
  const [showAddStation, setShowAddStation] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(null);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addressError, setAddressError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newStationData, setNewStationData] = useState({
    address: '',
    displayAddress: '',
    latitude: null,
    longitude: null,
    power: '',
    connectorType: '',
    currentType: '',
    additionalInfo: '' // Nuovo campo per informazioni aggiuntive
  });
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: ''
  });

  const searchAddresses = useCallback(
    debounce(async (query) => {
      if (query.length < 3) {
        setAddressError(null);
        setAddressSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoading(true);
      setAddressError(null);

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=5&countrycodes=it&addressdetails=1`
        );
        if (!response.ok) throw new Error('Errore nella ricerca degli indirizzi');

        const data = await response.json();
        if (data.length === 0) {
          setAddressError("Nessun risultato trovato per questo indirizzo");
          setAddressSuggestions([]);
        } else {
          const formattedSuggestions = data.map(suggestion => ({
            ...suggestion,
            formattedAddress: formatAddressComponents(suggestion.address)
          }));
          setAddressSuggestions(formattedSuggestions);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error('Errore nella ricerca indirizzi:', error);
        setAddressError("Errore nel caricamento dei suggerimenti. Riprova più tardi.");
        setAddressSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  const handleAddressSelection = (suggestion) => {
    try {
      const address = suggestion.address || {};
      if (!address.road && !address.house_number) {
        setAddressError('Indirizzo incompleto. Seleziona un indirizzo con via e numero.');
        return;
      }

      const lat = parseFloat(suggestion.lat);
      const lon = parseFloat(suggestion.lon);
      if (isNaN(lat) || isNaN(lon)) {
        setAddressError('Coordinate non valide. Seleziona un altro indirizzo.');
        return;
      }

      const formattedAddress = formatAddressComponents(address);
      setNewStationData({
        ...newStationData,
        displayAddress: formattedAddress,
        address: formattedAddress,
        latitude: lat,
        longitude: lon
      });
      setShowSuggestions(false);
      setAddressError(null);
    } catch (error) {
      console.error('Errore nella selezione dell\'indirizzo:', error);
      setAddressError('Errore nella selezione dell\'indirizzo. Riprova.');
    }
  };

  const handleAddStation = (e) => {
    e.preventDefault();
    const validationErrors = [];

    if (!newStationData.displayAddress?.trim()) {
      validationErrors.push('Inserisci un indirizzo valido');
    }
    if (!newStationData.latitude || !newStationData.longitude) {
      validationErrors.push('Coordinate non valide');
    }
    if (!newStationData.power?.trim()) {
      validationErrors.push('Inserisci la potenza');
    }
    if (!newStationData.connectorType?.trim()) {
      validationErrors.push('Seleziona il tipo di connettore');
    }
    if (!newStationData.currentType?.trim()) {
      validationErrors.push('Seleziona il tipo di corrente');
    }

    if (validationErrors.length > 0) {
      setAddressError(validationErrors.join('\n'));
      return;
    }

    try {
      onAddStation({
        ...newStationData,
        power: parseFloat(newStationData.power)
      });
      setNewStationData({
        address: '',
        displayAddress: '',
        latitude: null,
        longitude: null,
        power: '',
        connectorType: '',
        currentType: '',
        additionalInfo: ''
      });
      setShowAddStation(false);
      setAddressError(null);
    } catch (error) {
      console.error('Errore nel salvataggio della stazione:', error);
      setAddressError('Errore nel salvataggio della stazione. Riprova.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          className="pl-10"
          placeholder="Cerca per località o proprietario..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {!showAddStation ? (
        <Button
          className="w-full flex items-center justify-center gap-2"
          onClick={() => setShowAddStation(true)}
        >
          <Plus size={20} />
          Aggiungi la tua colonnina
        </Button>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin size={20} />
              Aggiungi una nuova colonnina
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddStation} className="space-y-4">
              <div className="relative">
                <Input
                  placeholder="Cerca indirizzo..."
                  value={newStationData.address}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewStationData({ ...newStationData, address: value });
                    searchAddresses(value);
                  }}
                  onFocus={() => {
                    if (addressSuggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  required
                />
                {isLoading && (
                  <div className="text-sm text-gray-500 mt-2">
                    Ricerca in corso...
                  </div>
                )}
                {addressError && <AddressError message={addressError} />}
                {showSuggestions && addressSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full bg-white mt-1 rounded-md shadow-lg max-h-60 overflow-auto">
                    {addressSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleAddressSelection(suggestion)}
                      >
                        {cleanDisplayAddress(suggestion.formattedAddress)}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="number"
                  placeholder="Potenza massima (kW)"
                  value={newStationData.power}
                  onChange={(e) => setNewStationData({ ...newStationData, power: e.target.value })}
                  min="0"
                  step="0.1"
                  required
                />
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newStationData.connectorType}
                  onChange={(e) => setNewStationData({ ...newStationData, connectorType: e.target.value })}
                  required
                >
                  <option value="">Tipo connettore</option>
                  <option value="Type 2">Type 2</option>
                  <option value="CCS">CCS</option>
                  <option value="CHAdeMO">CHAdeMO</option>
                  <option value="Type 1">Type 1</option>
                </select>
              </div>

              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newStationData.currentType}
                onChange={(e) => setNewStationData({ ...newStationData, currentType: e.target.value })}
                required
              >
                <option value="">Tipo corrente</option>
                <option value="AC monofase">AC monofase</option>
                <option value="AC trifase">AC trifase</option>
                <option value="DC">DC</option>
              </select>

              <div className="space-y-2">
                <label htmlFor="additionalInfo" className="text-sm font-medium">
                  Informazioni aggiuntive
                </label>
                <textarea
                  id="additionalInfo"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Inserisci informazioni aggiuntive (es. numero di telefono, indicazioni, orari...)"
                  value={newStationData.additionalInfo}
                  onChange={(e) => setNewStationData({ ...newStationData, additionalInfo: e.target.value })}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">Conferma</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddStation(false);
                    setAddressError(null);
                  }}
                  className="flex-1"
                >
                  Annulla
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {stations
          .filter(station =>
            station.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
            station.owner.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map(station => (
            <Card key={station.id}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{station.owner}</h3>
                      <p className="text-sm text-gray-600">
                        {cleanDisplayAddress(station.location)}
                      </p>
                      <div className="mt-2 space-y-1">
                        {station.power && (
                          <p className="text-sm">
                            <span className="font-medium">Potenza:</span> {station.power} kW
                          </p>
                        )}
                        {station.connectorType && (
                          <p className="text-sm">
                            <span className="font-medium">Connettore:</span> {station.connectorType}
                          </p>
                        )}
                       {station.currentType && (
                          <p className="text-sm">
                            <span className="font-medium">Corrente:</span> {station.currentType}
                          </p>
                        )}
                        {station.additionalInfo && (
                          <p className="text-sm">
                            <span className="font-medium">Info aggiuntive:</span> {station.additionalInfo}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <RatingStars rating={Math.round(station.rating)} />
                      <span className="text-sm ml-1">{station.rating}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${station.available ? 'text-green-600' : 'text-red-600'}`}>
                      ● {station.available ? 'Disponibile' : 'In uso'}
                    </span>
                    {station.ownerId === user.id ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={station.visible ? "destructive" : "default"}
                          onClick={() => onToggleStationStatus(station.id)}
                        >
                          {station.visible ? 'Metti offline' : 'Metti online'}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (window.confirm('Sei sicuro di voler eliminare questa colonnina?')) {
                              onDeleteStation(station.id);
                            }
                          }}
                        >
                          Elimina
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => onStartCharging(station)}
                        disabled={!station.available || !station.visible}
                      >
                        Avvia ricarica
                      </Button>
                    )}
                  </div>

                  {/* Recensioni */}
                  <div className="pt-2 border-t mt-2">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium">Recensioni</h4>
                      {station.ownerId !== user.id && !showReviewForm && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowReviewForm(station.id)}
                        >
                          Aggiungi recensione
                        </Button>
                      )}
                    </div>

                    {showReviewForm === station.id ? (
                      <div className="space-y-2">
                        <RatingStars
                          rating={reviewData.rating}
                          onRatingChange={(rating) => setReviewData(prev => ({ ...prev, rating }))}
                        />
                        <Input
                          placeholder="Scrivi una recensione..."
                          value={reviewData.comment}
                          onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                          maxLength={500}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              if (!reviewData.comment.trim()) {
                                alert('Inserisci un commento per la recensione');
                                return;
                              }
                              onAddReview(station.id, reviewData);
                              setShowReviewForm(null);
                              setReviewData({ rating: 5, comment: '' });
                            }}
                          >
                            Invia
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowReviewForm(null);
                              setReviewData({ rating: 5, comment: '' });
                            }}
                          >
                            Annulla
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {station.reviews?.map(review => (
                          <div key={review.id} className="text-sm">
                            <div className="flex items-center gap-2">
                              <RatingStars rating={review.rating} />
                              <span className="text-gray-600">- {review.user}</span>
                            </div>
                            <p className="text-gray-600 mt-1">{review.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
};

export default StationManagement;
