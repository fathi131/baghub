import { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
 

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      alert('Please fill all fields');
      return;
    }
    
    
    alert('Thank you! We will get back to you soon.');
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ color: '#03544c', marginBottom: '8px', fontSize: '36px' }}>
        Contact Us
      </h1>
      <p style={{ color: '#666', marginBottom: '40px', fontSize: '16px' }}>
        We'd love to hear from you! Get in touch with us.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', flexWrap: 'wrap' }}>
        {/* Contact Info */}
        <div>
          <h2 style={{ color: '#03544c', marginBottom: '20px' }}>Get in Touch</h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Mail size={24} color="#03544c" />
            <div>
              <div style={{ fontWeight: 600 }}>Email</div>
              <div style={{ color: '#666' }}>baghub@gmail.com</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Phone size={24} color="#03544c" />
            <div>
              <div style={{ fontWeight: 600 }}>Phone</div>
              <div style={{ color: '#666' }}>+91 88888 88888</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <MapPin size={24} color="#03544c" />
            <div>
              <div style={{ fontWeight: 600 }}>Address</div>
              <div style={{ color: '#666' }}>Kochi, Kerala, India</div>
            </div>
          </div>
        </div>

        
        <div>
          <h2 style={{ color: '#03544c', marginBottom: '20px' }}>Send Message</h2>

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Your Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ccc' }}
            />
            <input
              type="email"
              placeholder="Your Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ccc' }}
            />
            <textarea
              placeholder="Your Message"
              rows={5}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ccc' }}
            />
            <button
              type="submit"
              style={{
                background: '#03544c',
                color: '#fff',
                padding: '12px 30px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Send size={18} /> Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;