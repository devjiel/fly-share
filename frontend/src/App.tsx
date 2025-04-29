import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 shadow-lg p-4">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Fly-Share</h1>
          <nav>
            <ul className="flex space-x-4">
              <li><a href="/" className="text-white hover:text-blue-200">Accueil</a></li>
              <li><a href="/files" className="text-white hover:text-blue-200">Fichiers</a></li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="container mx-auto p-4 mt-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Bienvenue sur Fly-Share</h2>
          <p className="text-gray-700">
            Une application de partage de fichiers sur votre réseau local.
          </p>
          
          <div className="mt-8 p-4 bg-gray-50 rounded-md">
            <h3 className="text-lg font-medium mb-2">Glissez vos fichiers ici</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-gray-500">Ou cliquez pour sélectionner des fichiers</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-800 text-white p-4 mt-8">
        <div className="container mx-auto text-center">
          <p>© 2023 Fly-Share. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
