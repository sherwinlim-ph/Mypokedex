import React, { useState } from 'react';
import axios from 'axios';

function App() {

  const [pokemon, setPokemon] = useState(null); 
  const [searchTerm, setSearchTerm] = useState('');

 
  const searchPokemon = () => {
    axios.get(`https://pokeapi.co/api/v2/pokemon/${searchTerm.toLowerCase()}`)
      .then(response => {
        setPokemon(response.data); 
      })
      .catch(error => {
        console.error("Pokemon not found!", error);
        setPokemon(null);
      });
  };

  return (
    <div className='search-card'>

      <h2>Pokémon Search</h2>
      
      <input
        type="text" 
        value={searchTerm} 
        onChange={(e) => setSearchTerm(e.target.value)} 
        placeholder="Enter pokemon name (e.g., pikachu) : "
      />
    
      <button onClick={searchPokemon} className='btn-on-click'>Search</button>

      {pokemon && (
        <div className='search-card-bot'>

          <h3>{pokemon.name.toUpperCase()}</h3>
          <img src={pokemon.sprites.front_default} alt={pokemon.name} />
        </div>
      )}
    </div>
  );
}

export default App;