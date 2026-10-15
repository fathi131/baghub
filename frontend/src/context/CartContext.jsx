import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/axios'; 

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);

  
  const fetchCart = async () => {
    try {
      setLoading(true);
      const res = await API.get('/user/cart');
      
      const rawCart = res.data?.data?.items || res.data?.cart?.items || res.data?.items || [];

      const formattedItems = rawCart.map((item) => {
        const p = item.productId || item.product || {};
        return {
          _id: item._id,
          productId: p._id || item.productId, 
          name: p.name || p.title || 'Product',
          price: p.price || 0,
          quantity: item.quantity || 1,
          images: p.images || (p.image ? [p.image] : []),
          image: p.images?.[0] || p.image || '',
          stockCount: p.stockCount ?? 10,
          isBlocked: p.isBlocked || false,
          isAvailable: p.isAvailable ?? true,
          maxQuantityLimit: p.maxQuantityLimit || 5
        };
      });

      setCartItems(formattedItems);
    } catch (error) {
      console.error('Error fetching cart:', error);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const addToCart = async (product, quantity = 1) => {
    try {
      const productId = product?._id || product?.id || product?.productId;

      if (!productId) {
        alert('Product data is missing. Please try again.');
        return;
      }

      const res = await API.post('/user/cart/add', {
        productId,
        quantity: Number(quantity) || 1
      });

      await fetchCart();
      return res.data;
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert(error.response?.data?.message || 'Failed to add item to cart');
      throw error;
    }
  };

  
const updateQuantity = async (productId, delta) => {
  try {
  
    const targetItem = cartItems.find(
      (item) =>
        String(item.productId) === String(productId) ||
        String(item.id) === String(productId) ||
        String(item._id) === String(productId)
    );

    if (!targetItem) return;

  
    const action = delta > 0 ? 'inc' : 'dec';
    const realProductId = targetItem.productId || targetItem._id || targetItem.id;

    
    const res = await API.put('/user/cart/update', {
      productId: realProductId,
      action: action
    });

    if (res.data?.success) {
      
      setCartItems((prevItems) =>
        prevItems
          .map((item) => {
            const pId = item.productId || item._id || item.id;
            if (String(pId) === String(realProductId)) {
              if (action === 'inc') {
                return { ...item, quantity: item.quantity + 1 };
              } else if (action === 'dec') {
                return item.quantity > 1 ? { ...item, quantity: item.quantity - 1 } : null;
              }
            }
            return item;
          })
          .filter(Boolean) 
      );
    }
  } catch (error) {
    console.error('Error updating quantity:', error);
    alert(error.response?.data?.message || 'Failed to update quantity');
  }
};

  
  const removeFromCart = async (productId) => {
    try {
      await API.delete(`/user/cart/remove/${productId}`);
      await fetchCart();
    } catch (error) {
      console.error('Error removing item:', error);
      alert('Failed to remove item');
    }
  };

  const clearCart = async () => {
    setCartItems([]);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loading,
        fetchCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);