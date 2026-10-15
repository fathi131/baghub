import { ShoppingBag, Truck, Shield, Heart } from 'lucide-react';

const About = () => {
  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ color: '#03544c', marginBottom: '8px', fontSize: '36px' }}>
        About BagHub
      </h1>
      <p style={{ color: '#666', marginBottom: '40px', fontSize: '16px' }}>
        Your trusted destination for premium bags since 2025.
      </p>

      
      <div
        style={{
          background: '#e8f5e9',
          padding: '40px',
          borderRadius: '12px',
          marginBottom: '40px'
        }}
      >
        <h2 style={{ color: '#03544c', marginBottom: '16px' }}>Our Story</h2>
        <p style={{ lineHeight: 1.7, color: '#333', fontSize: '15px' }}>
          BagHub was founded with a simple mission: to provide high-quality, stylish bags
          that combine functionality with fashion. From backpacks for students to premium
          leather bags for professionals, we curate the best in every category.
        </p>
      </div>

      
      <h2 style={{ color: '#03544c', marginBottom: '24px' }}>Why Choose Us?</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        <div style={{ padding: '24px', background: '#f9f9f9', borderRadius: '12px', textAlign: 'center' }}>
          <ShoppingBag size={40} color="#03544c" style={{ marginBottom: '12px' }} />
          <h3 style={{ marginBottom: '8px' }}>Premium Quality</h3>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Hand-picked products from trusted brands.
          </p>
        </div>

        <div style={{ padding: '24px', background: '#f9f9f9', borderRadius: '12px', textAlign: 'center' }}>
          <Truck size={40} color="#03544c" style={{ marginBottom: '12px' }} />
          <h3 style={{ marginBottom: '8px' }}>Fast Delivery</h3>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Free shipping on all orders across India.
          </p>
        </div>

        <div style={{ padding: '24px', background: '#f9f9f9', borderRadius: '12px', textAlign: 'center' }}>
          <Shield size={40} color="#03544c" style={{ marginBottom: '12px' }} />
          <h3 style={{ marginBottom: '8px' }}>Secure Payments</h3>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Razorpay, Wallet, and COD options.
          </p>
        </div>

        <div style={{ padding: '24px', background: '#f9f9f9', borderRadius: '12px', textAlign: 'center' }}>
          <Heart size={40} color="#03544c" style={{ marginBottom: '12px' }} />
          <h3 style={{ marginBottom: '8px' }}>Customer First</h3>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Easy returns and quick support.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;