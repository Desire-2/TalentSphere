import { useParams } from 'react-router-dom';

const TestApplyRoute = () => {
  const { id } = useParams();
  
  console.log('🧪 TestApplyRoute loaded! Job ID:', id);
  
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', margin: '20px' }}>
      <h1>🧪 Test Apply Route</h1>
      <p>Job ID: {id}</p>
      <p>This is a test page to verify routing works!</p>
      <p>If you can see this, the route is working correctly.</p>
    </div>
  );
};

export default TestApplyRoute;
