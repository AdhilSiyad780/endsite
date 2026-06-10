import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import api from "../api/axios";
import { getGuestCart, addToGuestCart, updateGuestCart, removeFromGuestCart, clearGuestCart } from "../utils/guestCart";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);

  const fetchCart = async () => {
    if (user) {
      const { data } = await api.get("/cart");
      setCartItems(data.items || []);
    } else {
      setCartItems(getGuestCart());
    }
  };

  useEffect(() => { fetchCart(); }, [user]);

  const addToCart = async (variant, product) => {
    const item = {
      variant_id: variant.id,
      quantity: 1,
      product_name: product.name,
      size: variant.size,
      color: variant.color,
      price: variant.price_override || product.base_price,
      image_url: product.primary_image,
    };
    if (user) {
      await api.post("/cart/items", { variant_id: variant.id, quantity: 1 });
      await fetchCart();
    } else {
      addToGuestCart(item);
      setCartItems(getGuestCart());
    }
  };

  const mergeGuestCart = async () => {
    const guestCart = getGuestCart();
    if (guestCart.length > 0) {
      await api.post("/cart/merge", guestCart.map(i => ({ variant_id: i.variant_id, quantity: i.quantity })));
      clearGuestCart();
      await fetchCart();
    }
  };

  const updateQty = async (variant_id, qty) => {
    if (user) {
      const item = cartItems.find(i => i.variant_id === variant_id);
      if (item) await api.put(`/cart/items/${item.id}`, { variant_id, quantity: qty });
      await fetchCart();
    } else {
      updateGuestCart(variant_id, qty);
      setCartItems(getGuestCart());
    }
  };

  const removeItem = async (variant_id) => {
    if (user) {
      const item = cartItems.find(i => i.variant_id === variant_id);
      if (item) await api.delete(`/cart/items/${item.id}`);
      await fetchCart();
    } else {
      removeFromGuestCart(variant_id);
      setCartItems(getGuestCart());
    }
  };

  const clearCart = async () => {
    if (user) { await api.delete("/cart"); await fetchCart(); }
    else { clearGuestCart(); setCartItems([]); }
  };

  const cartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <CartContext.Provider value={{ cartItems, cartCount, addToCart, updateQty, removeItem, clearCart, mergeGuestCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);