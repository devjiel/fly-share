import './App.css';
import FileUploader from './components/FileUploader';

function App() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <header className="bg-blue-600 shadow-lg p-4">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Fly-Share</h1>
          <nav>
            <ul className="flex space-x-4">
              <li><a href="/" className="text-white hover:text-blue-200">Home</a></li>
              <li><a href="/files" className="text-white hover:text-blue-200">Files</a></li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="container mx-auto p-4 mt-8 flex-grow">
        <FileUploader />
      </main>

      <footer className="bg-gray-800 text-white p-4 mt-auto">
        <div className="container mx-auto text-center">
          <p>© 2025 Fly-Share. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
