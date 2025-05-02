import './App.css';
import FileUploader from './components/FileUploader';
import FileDownloader from './components/FileDownloader';

function App() {
  return (
    <div className="flex flex-col min-h-screen bg-dark-background text-dark-text">
      <header className="bg-dark-primary shadow-lg p-4 border-b border-dark-border">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-dark-text">Fly-Share</h1>
        </div>
      </header>

      <main className="container mx-auto p-4 mt-8 flex-grow">
        <div className="grid grid-cols-1 gap-8 w-full">
          <FileDownloader />
          <FileUploader />
        </div>
      </main>

      <footer className="bg-dark-primary p-4 mt-auto border-t border-dark-border">
        <div className="container mx-auto text-center text-dark-muted">
          <p>© 2025 Fly-Share. MIT License.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
