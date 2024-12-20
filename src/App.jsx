import './App.css';
import { WebGL } from './webgl';

function App() {
  return (
    <>
      <div>
        <section className='head'>
          <WebGL />
        </section>
        <section className='middle'>
          <h1>Infrared Gradient</h1>
        </section>
        <section className='small'>
          <div className='container'>
            <WebGL />
          </div>
        </section>
        <section className='footer'>
          <WebGL />
        </section>
      </div>
    </>
  );
}

export default App;
