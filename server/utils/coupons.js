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

const getCouponDiscount = (couponCode = "", subtotal = 0) => {
    const normalizedCode = couponCode.trim().toUpperCase();
    const coupon = coupons[normalizedCode];
    const discount = calculateCouponDiscount(coupon, subtotal);

    if (!coupon || discount <= 0) {
        return { coupon: null, discount: 0 };
    }

    return { coupon, discount };
}

export { getCouponDiscount };
