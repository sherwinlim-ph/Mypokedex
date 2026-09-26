import { useEffect, useState } from 'react';
import axios from 'axios';

const POKEMON_TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting',
  'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost',
  'dragon', 'dark', 'steel', 'fairy'
];

const TYPE_BACKGROUNDS = {
  all: '#ffffff',
  favorites: '#fff5f7',
  normal: '#f3f1df',
  fire: '#ffebe0',
  water: '#e5efff',
  electric: '#fff8cf',
  grass: '#e4f5df',
  ice: '#e1f7f7',
  fighting: '#ffe4e2',
  poison: '#f5e2f5',
  ground: '#fff1d3',
  flying: '#eee9ff',
  psychic: '#ffe5ee',
  bug: '#eff5d2',
  rock: '#f0eccf',
  ghost: '#ebe2f5',
  dragon: '#e5e0ff',
  dark: '#ebe4e0',
  steel: '#e8eaf2',
  fairy: '#ffe6f2'
};

const formatTypeName = (type) => type.charAt(0).toUpperCase() + type.slice(1);

function TypeBadges({ types }) {
  return (
    <div className="types-container">
      {types.map(({ type }) => (
        <span key={type.name} className={`type-badge bg-type-${type.name}`}>
          {type.name}
        </span>
      ))}
    </div>
  );
}

function PokemonCard({ pokemon, onSelect, onViewImage, isFavorite, onToggleFavorite }) {
  const mainType = pokemon.types[0].type.name;

  return (
    <div
      className={`pokemon-card border-type-${mainType}`}
      onClick={() => onSelect(pokemon)}
    >
      <button
        className={`favorite-btn ${isFavorite ? 'is-favorite' : ''}`}
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onToggleFavorite(pokemon.id);
        }}
        aria-label={isFavorite ? `Remove ${pokemon.name} from favorites` : `Add ${pokemon.name} to favorites`}
        aria-pressed={isFavorite}
        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <svg viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M20.8 8.7c0 5.2-8.8 10.1-8.8 10.1S3.2 13.9 3.2 8.7A4.7 4.7 0 0 1 12 6.2a4.7 4.7 0 0 1 8.8 2.5Z" />
        </svg>
      </button>
      <img
        className="pokemon-img"
        src={pokemon.sprites.front_default}
        alt={pokemon.name}
      />
      <button
        className="pokemon-image-btn"
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onViewImage(pokemon);
        }}
        aria-label={`View ${pokemon.name} image`}
        title={`View ${pokemon.name} image`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      </button>
      <p className={`pokemon-id text-type-${mainType}`}>#{pokemon.id}</p>
      <h2 className="pokemon-name">{pokemon.name}</h2>
      <TypeBadges types={pokemon.types} />
    </div>
  );
}

function PokemonDetails({ pokemon, onClose }) {
  const mainType = pokemon.types[0].type.name;
  const [showWeaknesses, setShowWeaknesses] = useState(false);
  const [showLocations, setShowLocations] = useState(false);
  const [weaknesses, setWeaknesses] = useState([]);
  const [weaknessesLoading, setWeaknessesLoading] = useState(true);
  const [weaknessesError, setWeaknessesError] = useState(false);
  const [locations, setLocations] = useState([]);
  const [habitat, setHabitat] = useState(null);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [locationsError, setLocationsError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadWeaknesses = async () => {
      setWeaknessesLoading(true);
      setWeaknessesError(false);

      try {
        const typeResponses = await Promise.all(
          pokemon.types.map(({ type }) => axios.get(type.url))
        );
        const defensiveTypes = typeResponses.map(({ data }) => data.damage_relations);
        const calculatedWeaknesses = POKEMON_TYPES.map((attackType) => {
          const multiplier = defensiveTypes.reduce((total, relations) => {
            if (relations.no_damage_from.some(({ name }) => name === attackType)) return 0;
            if (relations.double_damage_from.some(({ name }) => name === attackType)) return total * 2;
            if (relations.half_damage_from.some(({ name }) => name === attackType)) return total / 2;
            return total;
          }, 1);

          return multiplier > 1 ? { name: attackType, multiplier } : null;
        }).filter(Boolean);

        if (!cancelled) setWeaknesses(calculatedWeaknesses);
      } catch {
        if (!cancelled) setWeaknessesError(true);
      } finally {
        if (!cancelled) setWeaknessesLoading(false);
      }
    };

    loadWeaknesses();
    return () => {
      cancelled = true;
    };
  }, [pokemon]);

  useEffect(() => {
    let cancelled = false;

    const loadLocations = async () => {
      setLocationsLoading(true);
      setLocationsError(false);

      try {
        const [encountersResponse, speciesResponse] = await Promise.all([
          axios.get(pokemon.location_area_encounters),
          axios.get(pokemon.species.url)
        ]);
        const locationNames = encountersResponse.data.map(({ location_area }) => location_area.name);

        if (!cancelled) {
          setLocations([...new Set(locationNames)]);
          setHabitat(speciesResponse.data.habitat?.name || null);
        }
      } catch {
        if (!cancelled) setLocationsError(true);
      } finally {
        if (!cancelled) setLocationsLoading(false);
      }
    };

    loadLocations();
    return () => {
      cancelled = true;
    };
  }, [pokemon]);

  return (
    <div className="card-overlay" onClick={onClose}>
      <div
        className={`card-content border-type-${mainType}`}
        role="group"
        tabIndex={0}
        aria-label={`${pokemon.name} details. Click or press Enter to switch between stats and weaknesses.`}
        onClick={(event) => {
          event.stopPropagation();
          if (event.target.closest('button')) return;
          if (showLocations) {
            setShowLocations(false);
            return;
          }
          setShowWeaknesses((current) => !current);
        }}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setShowWeaknesses((current) => !current);
          }
        }}
      >
        <button
          className="card-flip-btn"
          type="button"
          onClick={() => {
            setShowLocations(false);
            setShowWeaknesses((current) => !current);
          }}
          aria-label={showWeaknesses ? 'Flip to stats' : 'Flip to weaknesses'}
          aria-pressed={showWeaknesses && !showLocations}
          title={showWeaknesses ? 'Flip to stats' : 'Flip to weaknesses'}
        >
          <svg
            className="flip-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 3v18" />
            <path d="m16 7 4 5-4 5" />
            <path d="m8 7-4 5 4 5" />
          </svg>
        </button>
        <button
          className="card-location-btn"
          type="button"
          onClick={() => setShowLocations(true)}
          aria-label={`Show where ${pokemon.name} can be found`}
          aria-pressed={showLocations}
          title="Show where this Pokemon can be found"
        >
          <svg
            className="location-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
        </button>
        <button
          className="card-close-btn"
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
          aria-label="Close details"
        >
          &times;
        </button>

        <div className={`card-face ${showLocations ? 'card-face-locations' : showWeaknesses ? 'card-face-weaknesses' : 'card-face-stats'}`}>
          {showLocations ? (
            <div className="location-view">
              <div className="card-header">
                <img
                  className="card-img"
                  src={pokemon.sprites.front_default}
                  alt={pokemon.name}
                />
                <div className="card-title">
                  <p className={`pokemon-id text-type-${mainType}`}>#{pokemon.id}</p>
                  <h2 className="pokemon-name">{pokemon.name}</h2>
                </div>
              </div>
              <div className="location-list" aria-live="polite">
                {locationsLoading && <p className="location-message">Loading locations...</p>}
                {locationsError && <p className="location-message">Locations could not be loaded.</p>}
                {!locationsLoading && !locationsError && habitat && (
                  <div className="habitat-item">
                    <span>Habitat</span>
                    <strong>{habitat.replaceAll('-', ' ')}</strong>
                  </div>
                )}
                {!locationsLoading && !locationsError && locations.length === 0 && (
                  <p className="location-message">No locations listed for this Pokemon.</p>
                )}
                {!locationsLoading && !locationsError && locations.map((location) => (
                  <div className="location-item" key={location}>
                    <svg className="location-list-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                      <circle cx="12" cy="10" r="2.5" />
                    </svg>
                    <span>{location.replaceAll('-', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : showWeaknesses ? (
            <div className="weakness-view">
              <div className="card-header">
                <img
                  className="card-img"
                  src={pokemon.sprites.front_default}
                  alt={pokemon.name}
                />
                <div className="card-title">
                  <p className={`pokemon-id text-type-${mainType}`}>#{pokemon.id}</p>
                  <h2 className="pokemon-name">{pokemon.name}</h2>
                </div>
              </div>
              <div className="weakness-list" aria-live="polite">
                {weaknessesLoading && <p className="weakness-message">Loading weaknesses...</p>}
                {weaknessesError && <p className="weakness-message">Weaknesses could not be loaded.</p>}
                {!weaknessesLoading && !weaknessesError && weaknesses.length === 0 && (
                  <p className="weakness-message">No type weaknesses.</p>
                )}
                {!weaknessesLoading && !weaknessesError && weaknesses.map(({ name, multiplier }) => (
                  <div
                    className={`weakness-item ${multiplier >= 4 ? 'weakness-item-severe' : ''}`}
                    key={name}
                    aria-label={`${formatTypeName(name)} attacks deal ${multiplier}x damage`}
                  >
                    <span className={`type-badge bg-type-${name}`}>{name}</span>
                    <span className="weakness-impact">
                      <strong>{multiplier}x</strong>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="card-header">
                <img
                  className="card-img"
                  src={pokemon.sprites.front_default}
                  alt={pokemon.name}
                />
                <div className="card-title">
                  <p className={`pokemon-id text-type-${mainType}`}>#{pokemon.id}</p>
                  <h2 className="pokemon-name">{pokemon.name}</h2>
                  <TypeBadges types={pokemon.types} />
                </div>
              </div>

              <div className="card-stats">
                <div className="stat-group">
                  <span className="stat-label">Height:</span>
                  <span className="stat-value">{pokemon.height / 10} m</span>
                </div>
                <div className="stat-group">
                  <span className="stat-label">Weight:</span>
                  <span className="stat-value">{pokemon.weight / 10} kg</span>
                </div>
                <div className="stat-group stats-section">
                  <span className="stat-label">Base Stats:</span>
                  <div className="stats-bars">
                    {pokemon.stats.map((stat) => (
                      <div key={stat.stat.name} className="stat-bar-container">
                        <span className="stat-name">{stat.stat.name.replace('-', ' ')}</span>
                        <span className="stat-num">{stat.base_stat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}

function PokemonImageZoom({ pokemon, onClose }) {
  return (
    <div className="image-zoom-overlay" onClick={onClose}>
      <div className="image-zoom-content" role="dialog" aria-modal="true" aria-label={`${pokemon.name} image`}>
        <button className="card-close-btn" type="button" onClick={onClose} aria-label="Close image">
          &times;
        </button>
        <img
          className="image-zoom-img"
          src={pokemon.sprites.front_default}
          alt={pokemon.name}
        />
      </div>
    </div>
  );
}

export default function PokemonSearch() {
  const [searchInput, setSearchInput] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [pokemonList, setPokemonList] = useState([]);
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [zoomedPokemon, setZoomedPokemon] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState([]);

  useEffect(() => {
    document.body.style.background = TYPE_BACKGROUNDS[selectedType];

    return () => {
      document.body.style.background = '';
    };
  }, [selectedType]);

  useEffect(() => {
    const loadPokemon = async () => {
      const response = await axios.get('https://pokeapi.co/api/v2/pokemon?limit=151');
      const responses = await Promise.all(
        response.data.results.map((pokemon) => axios.get(pokemon.url))
      );

      setPokemonList(responses.map(({ data }) => data));
    };

    loadPokemon();
  }, []);

  const filteredPokemon = pokemonList.filter((pokemon) =>
    pokemon.name.toLowerCase().includes(searchInput.toLowerCase()) &&
    (selectedType === 'all' ||
      (selectedType === 'favorites'
        ? favoriteIds.includes(pokemon.id)
        : pokemon.types.some(({ type }) => type.name === selectedType)))
  );

  const toggleFavorite = (pokemonId) => {
    setFavoriteIds((current) => (
      current.includes(pokemonId)
        ? current.filter((id) => id !== pokemonId)
        : [...current, pokemonId]
    ));
  };

  return (
    <div className={`app-container theme-type-${selectedType}`}>
      <form className="search-section" onSubmit={(event) => event.preventDefault()}>
        <input
          type="text"
          placeholder="Search Pokemon"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          aria-label="Filter Pokemon by type"
        >
          <option value="all">All types</option>
          <option value="favorites">Favorites</option>
          {POKEMON_TYPES.map((type) => (
            <option key={type} value={type}>
              {formatTypeName(type)}
            </option>
          ))}
        </select>
      </form>

      <div className="pokedex-grid">
        {filteredPokemon.map((pokemon) => (
          <PokemonCard
            key={pokemon.id}
            pokemon={pokemon}
            onSelect={setSelectedPokemon}
            onViewImage={setZoomedPokemon}
            isFavorite={favoriteIds.includes(pokemon.id)}
            onToggleFavorite={toggleFavorite}
          />
        ))}
      </div>

      {selectedPokemon && (
        <PokemonDetails pokemon={selectedPokemon} onClose={() => setSelectedPokemon(null)} />
      )}
      {zoomedPokemon && (
        <PokemonImageZoom pokemon={zoomedPokemon} onClose={() => setZoomedPokemon(null)} />
      )}
    </div>
  );
}
