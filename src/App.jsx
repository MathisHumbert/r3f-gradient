import './App.css';
import { WebGL } from './webgl';

function App() {
  return (
    <>
      <div className='canvas'>
        <WebGL />
      </div>
      <div>
        <section className='head'>
          <div className='webgl-item'></div>
        </section>
        <section className='middle'>
          <h1>Infrared Gradient</h1>
        </section>
        <section className='small'>
          <div className='container'>
            <div className='webgl-item'></div>
          </div>
        </section>
        <section className='footer'>
          <div className='webgl-item'></div>
        </section>
      </div>
    </>
  );
}

export default App;
