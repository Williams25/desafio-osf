import {
  useState,
  useEffect,
  createContext,
  ReactNode,
  useCallback,
  useMemo
} from "react";
import { Coupon } from "types/Coupon";
import { Products } from "types/Products";
import {
  createSessionStorage,
  removeItemSessionStorage
} from "utils/session-storage";
import { productService } from "services/products";
import { useRouter } from "next/router";

export type CartProviderData = {
  // eslint-disable-next-line no-unused-vars
  handleAddProductInCart: (product: Products) => void;
  // eslint-disable-next-line no-unused-vars
  removeProduct: (id: string) => void;
  // eslint-disable-next-line no-unused-vars
  verifyCoupon: (coupon: string) => void;
  productsCart: Products[];
  handleTotalProducts: number;
  handleTopayOrder: number;
  activeCoupons: Coupon | null;
  coupons: Coupon[];
  handleFinishPurchase: () => void;
};

export type CartProviderProps = {
  children: ReactNode;
};

export const CartContext = createContext({} as CartProviderData);

export const CartProvider = ({ children }: CartProviderProps) => {
  const [productsCart, setProductsCart] = useState<Products[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [activeCoupons, setActiveCoupons] = useState<Coupon | null>(null);

  const router = useRouter();

  const handleAddProductInCart = useCallback(
    (product: Products) => {
      const isProduct = productsCart.find((p) => p.id === product.id);
      if (isProduct) {
        const newCart = productsCart.filter((item) => {
          if (item.id === product.id) {
            item.quantity = product.quantity || 1;
          }

          return item;
        });
        setProductsCart([...newCart]);
      } else {
        setProductsCart([...productsCart, { ...product, quantity: 1 }]);
      }
    },
    [productsCart]
  );

  const removeProduct = useCallback(
    (id: string) => {
      const removeProduct = productsCart.filter((product) => product.id !== id);
      setProductsCart(removeProduct);
    },
    [productsCart]
  );

  const handleTotalProducts = useMemo(() => {
    return productsCart.reduce(
      (previous, current) => previous + current.quantity!,
      0
    );
  }, [productsCart]);

  const handleTopayOrder = useMemo(() => {
    return productsCart.reduce(
      (previous, current) => previous + current.quantity! * current.price,
      0
    );
  }, [productsCart]);

  const handleLoadCoupons = useCallback(async () => {
    const { data } = await productService.getAllCoupons();
    setCoupons(data);
  }, [coupons]);

  const verifyCoupon = (coupon: string) => {
    const verify = coupons.find(
      (c) => c.name.trim().toLowerCase() === coupon.trim().toLowerCase()
    );
    setActiveCoupons(verify ? verify : null);

    verify
      ? createSessionStorage(verify.name, "active-coupon")
      : removeItemSessionStorage("active-coupon");
  };

  const handleFinishPurchase = useCallback(() => {
    router.push("/compra-finalizada");
    removeItemSessionStorage("active-coupon");
    removeItemSessionStorage("cart");

    setProductsCart([]);
    setActiveCoupons(null);
  }, [productsCart, activeCoupons]);

  useEffect(() => {
    createSessionStorage(JSON.stringify(productsCart), "cart");
  }, [productsCart]);

  useEffect(() => {
    handleLoadCoupons();
  }, []);

  return (
    <CartContext.Provider
      value={{
        removeProduct,
        handleAddProductInCart,
        productsCart,
        handleTotalProducts,
        handleTopayOrder,
        activeCoupons,
        verifyCoupon,
        coupons,
        handleFinishPurchase
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
