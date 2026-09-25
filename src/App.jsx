import { useEffect, useState } from 'react';
import axios from 'axios';

// Supported filters from the first 151 Pokemon.
const POKEMON_TYPES = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting',
  'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost',
  'dragon', 'dark', 'steel', 'fairy'
];

const formatTypeName = (type) => type.charAt(0).toUpperCase() + type.slice(1);

// Render the type pills used in cards and the detail view.
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

// Render one Pokemon in the main grid.
function PokemonCard({ pokemon, onSelect }) {
  const mainType = pokemon.types[0].type.name;

  return (
    <div
      className={`pokemon-card border-type-${mainType}`}
      onClick={() => onSelect(pokemon)}
    >
      <img
        className="pokemon-img"
        src={pokemon.sprites.front_default}
        alt={pokemon.name}
      />
      <p className={`pokemon-id text-type-${mainType}`}>#{pokemon.id}</p>
      <h2 className="pokemon-name">{pokemon.name}</h2>
      <TypeBadges types={pokemon.types} />
    </div>
  );
}

// Render the selected Pokemon details in the modal.
function PokemonDetails({ pokemon, onClose }) {
  const mainType = pokemon.types[0].type.name;

  return (
    <div className="card-overlay" onClick={onClose}>
      <div
        className={`card-content border-type-${mainType}`}
        onClick={(event) => event.stopPropagation()}
      >
        <button className="card-close-btn" onClick={onClose} aria-label="Close details">
          &times;
        </button>

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
      </div>
    </div>
  );
}

export default function PokemonSearch() {
  // Keep the current controls and selected card in one place.
  const [searchInput, setSearchInput] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [pokemonList, setPokemonList] = useState([]);
  const [selectedPokemon, setSelectedPokemon] = useState(null);

  // Load the original 151 Pokemon once when the app starts.
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

  // Apply both controls to the visible cards.
  const filteredPokemon = pokemonList.filter((pokemon) =>
    pokemon.name.toLowerCase().includes(searchInput.toLowerCase()) &&
    (selectedType === 'all' || pokemon.types.some(({ type }) => type.name === selectedType))
  );

  return (
    <div className="app-container">
      {/* Search and filter controls */}
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
          {POKEMON_TYPES.map((type) => (
            <option key={type} value={type}>
              {formatTypeName(type)}
            </option>
          ))}
        </select>
      </form>

      {/* Pokemon collection */}
      <div className="pokedex-grid">
        {filteredPokemon.map((pokemon) => (
          <PokemonCard
            key={pokemon.id}
            pokemon={pokemon}
            onSelect={setSelectedPokemon}
          />
        ))}
      </div>

      {selectedPokemon && (
        <PokemonDetails pokemon={selectedPokemon} onClose={() => setSelectedPokemon(null)} />
      )}
    </div>
  );
}
