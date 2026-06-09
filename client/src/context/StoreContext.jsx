import axios from "axios";
import { createContext, useEffect, useState } from "react";
// import {food_list} from "../assets/assets.js"
export const StoreContext = createContext(null)

const coupons = {
    WELCOME20: { code: "WELCOME20", type: "percent", value: 20, minAmount: 20, maxDiscount: 8 },
    FEASTO10: { code: "FEASTO10", type: "percent", value: 10, minAmount: 0, maxDiscount: 6 },
    SAVE5: { code: "SAVE5", type: "fixed", value: 5, minAmount: 25 }
}

const calculateCouponDiscount = (coupon, subtotal) => {
    if (!coupon || subtotal <= 0 || subtotal < coupon.minAmount) {
        return 0;
    }

    const discount = coupon.type === "percent"
        ? subtotal * (coupon.value / 100)
        : coupon.value;

    return Math.min(discount, coupon.maxDiscount || discount, subtotal);
}


const StoreContextProvider = (props)=>{

    const [cartItems,setCartItems] = useState({});
    const [appliedCoupon,setAppliedCoupon] = useState(null);
    const [couponMessage,setCouponMessage] = useState("");

const url = "https://feasto-backend-e0ic.onrender.com"
const[token,setToken] = useState("");
const [food_list,setFoodList] = useState([])

    const addToCart = async (itemId)=>{
        if (!cartItems[itemId]) {
            setCartItems((prev)=>({...prev,[itemId]:1}))
        }
        else{
            setCartItems((prev)=>({...prev,[itemId]:prev[itemId]+1}))

        }
        if (token) {
            await axios.post(url+"/api/cart/add",{itemId},{headers:{token}})
        }
    }

const removeFromCart = async (itemId)=>{
    setCartItems((prev)=>({...prev,[itemId]:prev[itemId]-1}))
    if (token) {
        await axios.post(url+"/api/cart/remove",{itemId},{headers:{token}})
    }
}

const getTotalCartAmount = ()=>{
    let totalAmount=0;
    for(const item in cartItems)
    {
        if (cartItems[item] > 0 ) 
        {
            let ItemInfo = food_list.find((product)=>product._id === item);
            if (ItemInfo) {
                totalAmount+=ItemInfo.price* cartItems[item]
            }
        }
    }
    return totalAmount
}

const getDeliveryFee = () => getTotalCartAmount() === 0 ? 0 : 2;

const getCartDiscount = () => calculateCouponDiscount(appliedCoupon,getTotalCartAmount());

const getFinalCartTotal = () => {
    const subtotal = getTotalCartAmount();
    if (subtotal === 0) {
        return 0;
    }
    return subtotal - getCartDiscount() + getDeliveryFee();
}

const applyCoupon = (code) => {
    const normalizedCode = code.trim().toUpperCase();
    const coupon = coupons[normalizedCode];
    const subtotal = getTotalCartAmount();

    if (!normalizedCode) {
        setAppliedCoupon(null);
        setCouponMessage("Please enter a promo code.");
        return false;
    }

    if (!coupon) {
        setAppliedCoupon(null);
        setCouponMessage("Invalid promo code.");
        return false;
    }

    if (subtotal < coupon.minAmount) {
        setAppliedCoupon(null);
        setCouponMessage(`Add $${coupon.minAmount - subtotal} more to use ${coupon.code}.`);
        return false;
    }

    setAppliedCoupon(coupon);
    setCouponMessage(`${coupon.code} applied successfully.`);
    return true;
}

const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponMessage("");
}

const fetchFoodList = async () => {
    const response = await axios.get(`${url}/api/food/list`)
    setFoodList(response.data.data)
}

const loadCartData = async (token) => {
    const response = await axios.post(url+"/api/cart/get",{},{headers:{token}})
    setCartItems(response.data.cartData)
}


useEffect(() => {
  

  async function loadData() {
    await fetchFoodList()
      if (localStorage.getItem("token")) {
   setToken( localStorage.getItem("token"))
   await loadCartData(localStorage.getItem("token"))
  }
  }
  loadData();
}, [])



useEffect(() => {
  if (appliedCoupon && getTotalCartAmount() < appliedCoupon.minAmount) {
    setCouponMessage(`Coupon removed. Minimum order for ${appliedCoupon.code} is $${appliedCoupon.minAmount}.`);
    setAppliedCoupon(null);
  }
}, [cartItems, food_list])

const contextValue = {
food_list,cartItems,setCartItems,addToCart,removeFromCart,getTotalCartAmount,getDeliveryFee,getCartDiscount,getFinalCartTotal,applyCoupon,removeCoupon,appliedCoupon,couponMessage,url,token,setToken
}
return <StoreContext.Provider value={contextValue}>
    {props.children}
</StoreContext.Provider>

}

export default StoreContextProvider;
