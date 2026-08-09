import React, { useState, useEffect, useMemo, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, getDocs, updateDoc, onSnapshot } from "firebase/firestore";
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  ShoppingCart, Truck, Leaf, MapPin, Clock, CreditCard, CheckCircle2,
  Lock, Plus, Minus, ChevronRight, Package, ArrowLeft, X, Banknote,
  ShieldCheck, Search, Trash2, ChevronDown, Home as HomeIcon, Store,
  ClipboardList, Settings, Circle, CheckCircle, Phone, Building2, User as UserIcon, Mail, LogOut, TrendingUp, BookOpen, Instagram, Citrus, Menu, Gift, Calculator
} from "lucide-react";

/* ============================================================================
   DAROUSHA FRESH — brand tokens
   Palette: soil-deep green (leaves), warm carrot orange (CTA), cream (base),
   soil brown (ink), tomato red (alerts/sale).
   Type: display = "Playfair Display" (elegant high-contrast serif) for
   headings; body = "Manrope" for UI copy; mono = "IBM Plex Mono" for prices,
   used like real market stall tags.
   Signature: circular "farm stamp" badge logo + tilted price-tag chips that
   mimic handwritten produce-stall labels.
============================================================================ */

const FONT_LINK_ID = "dsf-fonts";
function useBrandFonts() {
  useEffect(() => {
    if (document.getElementById(FONT_LINK_ID)) return;
    const link = document.createElement("link");
    link.id = FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,700&family=Manrope:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;600&family=Cairo:wght@400;500;600;700;800&display=swap";
    document.head.appendChild(link);
  }, []);
}

const STYLE_TAG_ID = "dsf-responsive-styles";
function useResponsiveStyles() {
  useEffect(() => {
    if (document.getElementById(STYLE_TAG_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_TAG_ID;
    style.textContent = `
      @media (max-width: 760px) {
        .dsf-hero { grid-template-columns: 1fr !important; }
        .dsf-about-grid { grid-template-columns: 1fr !important; }
        .dsf-checkout-grid { grid-template-columns: 1fr !important; }
        .dsf-shop-grid { grid-template-columns: 1fr !important; }
        .dsf-shop-grid > div:first-child { display: flex !important; flex-direction: row !important; overflow-x: auto; gap: 6px !important; padding-bottom: 6px; }
        .dsf-shop-grid > div:first-child button { white-space: nowrap; }
        .dsf-wordmark-hide-mobile { display: none; }
        .dsf-header-nav { display: none !important; }
        .dsf-header-hamburger { display: flex !important; }
      }
      .pac-container { z-index: 10000 !important; }
      .dsf-header-nav::-webkit-scrollbar { display: none; }
      .dsf-pulse-ring { animation: dsf-pulse 1.8s ease-out infinite; }
      @keyframes dsf-pulse {
        0% { transform: scale(0.6); opacity: 0.5; }
        100% { transform: scale(1.8); opacity: 0; }
      }
      @media print {
        .no-print { display: none !important; }
        body { background: #fff !important; }
        @page { size: A4; margin: 12mm; }
        .dsf-recipe-grid { display: block !important; }
        .dsf-recipe-card { break-after: page; page-break-after: always; margin-bottom: 0 !important; }
        .dsf-recipe-card:last-child { break-after: auto; page-break-after: auto; }
        .print-only-inline { display: inline !important; }
      }
      .print-only-inline { display: none; }
    `;
    document.head.appendChild(style);
  }, []);
}
const BRAND = {
  green: "#123822",
  greenDark: "#0B2417",
  greenSoft: "#DCE6DD",
  cream: "#F7F1E4",
  creamDeep: "#EBE1C9",
  orange: "#C6A24C",
  orangeDeep: "#9C7F30",
  tomato: "#A83B32",
  ink: "#231F16",
  gold: "#C6A24C",
  goldSoft: "#E7D9AE",
};

/* ============================================================================
   i18n: language toggle (English / Arabic) with RTL support
============================================================================ */
const LangContext = React.createContext({ lang: "en", setLang: () => {}, t: (k) => k, dir: "ltr" });
function useLang() {
  return React.useContext(LangContext);
}

const TRANSLATIONS = {
  en: {
    nav_shop: "Shop", nav_boxes: "Boxes", nav_commercial: "Commercial", nav_track: "Track",
    nav_signin: "Sign in", nav_account: "Account",
    hero_badge: "SAME-DAY DELIVERY IN YOUR AREA",
    hero_h1a: "Farm-fresh vegetables,", hero_h1b: "at your door", hero_h1c: "today.",
    hero_sub: "Your personal shopper hand-picks every item, packs it with care, and delivers it fresh to your door.",
    hero_cta_boxes: "Choose a box", hero_cta_shop: "Shop vegetables",
    badge_quality: "Naturally Grown", badge_fresh: "Fresh Every Day", badge_supply: "Personal Shopper", badge_delivery: "On Time Delivery",
    how_eyebrow: "How it works", how_title: "Home delivery, made simple",
    how1_t: "Pick your box", how1_b: "Choose a Daily, Family, Signature, or Chef's Box — or pick any single item as its own Small, Medium, or Large box.",
    how2_t: "Your personal shopper picks it", how2_b: "A real person on our team hand-selects the best quality for you and packs it fresh the same day — never pre-stored.",
    how3_t: "Track it home", how3_b: "Follow your order live from packing to your doorstep.",
    boxes_eyebrow: "Delivery boxes", boxes_title: "Three sizes, one simple price", view_box: "View box",
    story_eyebrow: "Our story", story_title: "Grown on trust, packed with care",
    story_p1: "Darousha Fresh started with a simple promise: vegetables that taste like they were picked this morning, because they were. Every order is hand-sorted the same day it ships — nothing sits in a warehouse, nothing is pre-bagged and forgotten.",
    story_p2: "That care shows in the packaging as much as the produce. Our Daily Box uses matte-laminated, gold foil–stamped cartons with die-cut handles for easy carrying. The Family Box steps up to double-wall, ventilated cardboard that keeps greens crisp on the ride over. And our Signature Box is a rigid gift box with a magnetic closure and ribbon handles — built for hosting, gifting, or simply treating your own kitchen well.",
    story_p3: "We work directly with growers we trust, which is why every bag of onions or bulb of garlic carries the same green-and-gold seal — our word that what's inside is fresh, sorted by hand, and ready for your kitchen.",
    bestsellers_eyebrow: "Best sellers", bestsellers_title: "Popular this week",
    shop_eyebrow: "Shop", shop_title: "Build your own basket",
    search_placeholder: "Search vegetables, herbs, greens…",
    add_to_cart: "Add to cart", in_cart: "In cart", out_of_stock: "Out of stock", no_results: "No items match",
    boxes_page_eyebrow: "Delivery boxes", boxes_page_title: "Pick a size, we pack the rest",
    boxes_page_sub: "A curated mix of best-selling vegetables and herbs, portioned by household size. Swap individual items any time from the Shop tab.",
    whats_inside: "What's inside",
    cart_eyebrow: "Your order", cart_title: "Cart", cart_empty: "Your cart is empty",
    cart_empty_sub: "Add one of our boxes to get started.", browse_shop: "Browse our boxes",
    subtotal: "Subtotal", delivery_fee: "Delivery fee", free: "Free", total: "Total",
    free_delivery_note: "Free delivery over", proceed_checkout: "Proceed to checkout",
    vat_label: "VAT (5%)",
    leave_at_door: "Leave at my door (contactless delivery)",
    checkout_eyebrow: "Checkout", checkout_title: "Delivery & payment", back_to_cart: "Back to cart",
    delivery_info: "Delivery information", full_name: "Full name", phone_number: "Phone number",
    delivery_address: "Delivery address", area: "Area",
    delivery_datetime: "Delivery date & time", delivery_date: "Delivery date", time_slot: "Time slot",
    payment_method: "Payment method", cod: "Cash on delivery", card: "Card",
    demo_notice: "Demo checkout — no real card charge is made.",
    card_number: "Card number", expiry: "Expiry", cvc: "CVC",
    order_summary: "Order summary", place_order: "Place order", placing_order: "Placing order…",
    fill_fields: "Fill in name, phone, address and date to continue.",
    confirm_title: "Order placed!", confirm_sub: "has been sent to our team and is being prepared.",
    shopper_note: "Your personal shopper is hand-picking it now",
    geo_share: "Share my exact location", geo_loading: "Getting your location…", geo_shared: "Location shared ✓", geo_denied: "Location wasn't shared — your typed address will be used instead.",
    track_my_order: "Track my order", continue_shopping: "Continue shopping",
    track_eyebrow: "Delivery tracking", track_title: "Where's my order?",
    track_placeholder: "Enter order ID e.g. DF123456",
    track_enter_id: "Enter your order ID (emailed / shown at checkout) to see live status.",
    track_not_found: "No order found with that ID.",
    order_label: "Order", delivery_window: "Delivery window", items_label: "Items",
    status_placed: "Order Placed", status_preparing: "Preparing", status_out: "Out for Delivery", status_delivered: "Delivered",
    account_eyebrow: "Your account", sign_in_title: "Sign in", sign_up_title: "Create your account",
    sign_in: "Sign in", sign_up: "Sign up", email: "Email", password: "Password",
    create_account: "Create account", creating_account: "Creating account…", signing_in: "Signing in…",
    forgot_password: "Forgot password?", reset_password_title: "Reset your password",
    reset_password_prompt: "Enter your account email and we'll send you a link to set a new password.",
    send_reset_link: "Send reset link", sending_reset_link: "Sending…",
    reset_link_sent: "If an account exists for that email, a reset link is on its way — check your inbox (and spam folder).",
    back_to_sign_in: "Back to sign in",
    sign_out: "Sign out", your_orders: "Your orders", no_orders_yet: "No orders yet — your history will show up here once you place one.",
    saved_note: "Saved from your last order — checkout will be pre-filled with these details automatically.",
    track_btn: "Track",
    gate_eyebrow: "One quick step", gate_title: "Sign in to check out",
    gate_body: "Create an account (or sign back in) to place your order — it saves your details for next time and lets you track every order from one place.",
    commercial_soon: "COMING SOON", commercial_eyebrow: "For hotels, restaurants & catering", commercial_title: "Darousha Fresh Commercial",
    commercial_p1: "We're building a dedicated commercial line for kitchens that need more than a household box — bulk vegetables, consistent quality, and a carton built for the back of a delivery van, not a doorstep.",
    commercial_p2: "Every export carton is heavy-duty, batch-numbered and QR-coded, so your kitchen team can trace exactly what's inside and when it was packed — stacked and shipped the way a busy service actually works.",
    early_access_title: "Get early access", early_access_sub: "Tell us about your business and we'll notify you the moment commercial ordering launches.",
    business_name: "Business name", contact_name: "Contact name", est_volume: "Estimated weekly volume (optional)",
    anything_else: "Anything else? (optional)", request_access: "Request early access",
    thanks_title: "Thanks — you're on the list", thanks_body: "We'll reach out as soon as commercial ordering opens, with early pricing for",
    footer_about: "About", footer_location: "Location", footer_privacy: "Privacy", footer_terms: "Terms",
    footer_recipes: "Recipes",
    footer_blog: "Blog",
    footer_track: "Track order", footer_backstage: "Backstage",
    back_home: "Back home",
  },
  ar: {
    nav_shop: "المتجر", nav_boxes: "الصناديق", nav_commercial: "تجاري", nav_track: "تتبع الطلب",
    nav_signin: "تسجيل الدخول", nav_account: "حسابي",
    hero_badge: "توصيل في نفس اليوم إلى منطقتك",
    hero_h1a: "خضروات طازجة من المزرعة،", hero_h1b: "إلى بابك", hero_h1c: "اليوم.",
    hero_sub: "شخصي التسوق لدينا يختار كل صنف بعناية يدويًا، يغلّفه بحرص، ويوصله طازجًا إلى بابك.",
    hero_cta_boxes: "اختر صندوقًا", hero_cta_shop: "تسوق الخضروات",
    badge_quality: "نمو طبيعي", badge_fresh: "طازج كل يوم", badge_supply: "شخصي تسوق مخصص", badge_delivery: "توصيل في الموعد",
    how_eyebrow: "كيف تعمل الخدمة", how_title: "توصيل منزلي بكل بساطة",
    how1_t: "اختر صندوقك", how1_b: "اختر الصندوق اليومي أو صندوق العائلة أو المميز أو صندوق الشيف — أو اختر أي صنف بمفرده كصندوق صغير أو متوسط أو كبير.",
    how2_t: "شخصي التسوق يختاره لك", how2_b: "شخص حقيقي من فريقنا يختار لك يدويًا أفضل جودة ويغلّفه طازجًا في نفس اليوم — دون تخزين مسبق.",
    how3_t: "تتبعه حتى بابك", how3_b: "تابع طلبك مباشرة من التغليف حتى وصوله إليك.",
    boxes_eyebrow: "صناديق التوصيل", boxes_title: "ثلاثة أحجام، سعر واحد بسيط", view_box: "عرض الصندوق",
    story_eyebrow: "قصتنا", story_title: "نُزرع بثقة، ونُغلّف بعناية",
    story_p1: "بدأت داروشا فريش بوعد بسيط: خضروات بطعم من قُطفت هذا الصباح، لأنها بالفعل كذلك. يتم فرز كل طلب يدويًا في نفس يوم شحنه — لا شيء يبقى في المستودع، ولا شيء يُعبأ مسبقًا وينسى.",
    story_p2: "هذه العناية تظهر في التغليف كما تظهر في المنتج. الصندوق اليومي يستخدم كرتونًا لامعًا مطبوعًا بالذهبي مع مقابض سهلة الحمل. صندوق العائلة يرتقي إلى كرتون مزدوج الجدار ومهوّى يحافظ على نضارة الخضار الورقية أثناء النقل. أما صندوقنا المميز فهو صندوق هدايا صلب بإغلاق مغناطيسي ومقابض شريطية — مثالي للاستضافة أو الإهداء أو لتدليل مطبخك.",
    story_p3: "نعمل مباشرة مع مزارعين نثق بهم، ولهذا يحمل كل كيس بصل أو رأس ثوم نفس الختم الأخضر والذهبي — وعدنا بأن ما بداخله طازج، مفروز يدويًا، وجاهز لمطبخك.",
    bestsellers_eyebrow: "الأكثر مبيعًا", bestsellers_title: "الأكثر رواجًا هذا الأسبوع",
    shop_eyebrow: "المتجر", shop_title: "كوّن سلتك الخاصة",
    search_placeholder: "ابحث عن خضروات وأعشاب وورقيات…",
    add_to_cart: "أضف إلى السلة", in_cart: "في السلة", out_of_stock: "غير متوفر", no_results: "لا توجد نتائج مطابقة لـ",
    boxes_page_eyebrow: "صناديق التوصيل", boxes_page_title: "اختر الحجم، ونحن نتكفل بالباقي",
    boxes_page_sub: "مزيج مختار بعناية من أكثر الخضروات والأعشاب مبيعًا، بكميات تناسب حجم المنزل. يمكنك استبدال أي عنصر في أي وقت من تبويب المتجر.",
    whats_inside: "محتويات الصندوق",
    cart_eyebrow: "طلبك", cart_title: "السلة", cart_empty: "سلتك فارغة",
    cart_empty_sub: "أضف أحد صناديقنا للبدء.", browse_shop: "تصفح صناديقنا",
    subtotal: "المجموع الفرعي", delivery_fee: "رسوم التوصيل", free: "مجاني", total: "الإجمالي",
    free_delivery_note: "توصيل مجاني فوق", proceed_checkout: "المتابعة للدفع",
    vat_label: "ضريبة القيمة المضافة (٥٪)",
    leave_at_door: "اترك الطلب أمام الباب (توصيل بدون تلامس)",
    checkout_eyebrow: "الدفع", checkout_title: "التوصيل والدفع", back_to_cart: "العودة إلى السلة",
    delivery_info: "معلومات التوصيل", full_name: "الاسم الكامل", phone_number: "رقم الهاتف",
    delivery_address: "عنوان التوصيل", area: "المنطقة",
    delivery_datetime: "تاريخ ووقت التوصيل", delivery_date: "تاريخ التوصيل", time_slot: "الفترة الزمنية",
    payment_method: "طريقة الدفع", cod: "الدفع عند الاستلام", card: "بطاقة",
    demo_notice: "دفع تجريبي — لن يتم خصم أي مبلغ حقيقي.",
    card_number: "رقم البطاقة", expiry: "تاريخ الانتهاء", cvc: "رمز التحقق",
    order_summary: "ملخص الطلب", place_order: "إتمام الطلب", placing_order: "جارٍ إرسال الطلب…",
    fill_fields: "يرجى إدخال الاسم والهاتف والعنوان والتاريخ للمتابعة.",
    confirm_title: "تم إرسال طلبك!", confirm_sub: "تم إرساله إلى فريقنا وجارٍ تجهيزه.",
    shopper_note: "شخصي التسوق يختاره لك يدويًا الآن",
    geo_share: "شارك موقعي الدقيق", geo_loading: "جارٍ تحديد موقعك…", geo_shared: "تمت مشاركة الموقع ✓", geo_denied: "لم تتم مشاركة الموقع — سيُستخدم العنوان المكتوب بدلاً منه.",
    track_my_order: "تتبع طلبي", continue_shopping: "متابعة التسوق",
    track_eyebrow: "تتبع التوصيل", track_title: "أين طلبي؟",
    track_placeholder: "أدخل رقم الطلب مثل DF123456",
    track_enter_id: "أدخل رقم طلبك (المرسل عبر البريد / الظاهر عند الدفع) لمعرفة حالته مباشرة.",
    track_not_found: "لم يتم العثور على طلب بهذا الرقم.",
    order_label: "الطلب", delivery_window: "فترة التوصيل", items_label: "العناصر",
    status_placed: "تم استلام الطلب", status_preparing: "قيد التجهيز", status_out: "خرج للتوصيل", status_delivered: "تم التوصيل",
    account_eyebrow: "حسابك", sign_in_title: "تسجيل الدخول", sign_up_title: "إنشاء حسابك",
    sign_in: "تسجيل الدخول", sign_up: "إنشاء حساب", email: "البريد الإلكتروني", password: "كلمة المرور",
    create_account: "إنشاء الحساب", creating_account: "جارٍ إنشاء الحساب…", signing_in: "جارٍ تسجيل الدخول…",
    forgot_password: "نسيت كلمة المرور؟", reset_password_title: "إعادة تعيين كلمة المرور",
    reset_password_prompt: "أدخل البريد الإلكتروني الخاص بحسابك وسنرسل لك رابطًا لتعيين كلمة مرور جديدة.",
    send_reset_link: "إرسال رابط إعادة التعيين", sending_reset_link: "جارٍ الإرسال…",
    reset_link_sent: "إذا كان هناك حساب مرتبط بهذا البريد الإلكتروني، فسيصلك رابط إعادة التعيين قريبًا — تحقق من بريدك الوارد (ومجلد الرسائل غير المرغوب فيها).",
    back_to_sign_in: "العودة لتسجيل الدخول",
    sign_out: "تسجيل الخروج", your_orders: "طلباتك", no_orders_yet: "لا توجد طلبات بعد — ستظهر هنا بمجرد إتمام أول طلب.",
    saved_note: "تم الحفظ من طلبك الأخير — سيتم تعبئة بيانات الدفع تلقائيًا في المرة القادمة.",
    track_btn: "تتبع",
    gate_eyebrow: "خطوة سريعة", gate_title: "سجّل الدخول لإتمام الطلب",
    gate_body: "أنشئ حسابًا (أو سجّل الدخول) لإتمام طلبك — يحفظ بياناتك للمرة القادمة ويتيح لك تتبع كل طلباتك من مكان واحد.",
    commercial_soon: "قريبًا", commercial_eyebrow: "للفنادق والمطاعم وشركات التموين", commercial_title: "داروشا فريش للأعمال",
    commercial_p1: "نعمل على تطوير خط تجاري مخصص للمطابخ التي تحتاج أكثر من صندوق منزلي — خضروات بكميات كبيرة، وجودة ثابتة، وكرتون مصمم لمؤخرة شاحنة التوصيل لا لعتبة الباب.",
    commercial_p2: "كل كرتون تصدير متين ومرقّم بالدفعة ومزوّد برمز QR، ليتمكن فريق مطبخك من تتبع محتوياته بدقة وموعد تعبئته — يُكدّس ويُشحن بالطريقة التي تناسب خدمة مزدحمة فعلًا.",
    early_access_title: "احصل على وصول مبكر", early_access_sub: "أخبرنا عن نشاطك التجاري وسنقوم بإعلامك فور إطلاق الطلب التجاري.",
    business_name: "اسم النشاط التجاري", contact_name: "اسم جهة الاتصال", est_volume: "الكمية الأسبوعية المتوقعة (اختياري)",
    anything_else: "أي شيء آخر؟ (اختياري)", request_access: "طلب وصول مبكر",
    thanks_title: "شكرًا — تمت إضافتك للقائمة", thanks_body: "سنتواصل معك فور فتح الطلب التجاري، مع أسعار خاصة لـ",
    footer_about: "من نحن", footer_location: "الموقع", footer_privacy: "الخصوصية", footer_terms: "الشروط",
    footer_recipes: "وصفات",
    footer_blog: "المدونة",
    footer_track: "تتبع الطلب", footer_backstage: "لوحة الإدارة",
    back_home: "العودة للرئيسية",
  },
};

function LangProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem("dsf-lang") || "en";
    } catch {
      return "en";
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("dsf-lang", lang);
    } catch {}
  }, [lang]);
  const dir = lang === "ar" ? "rtl" : "ltr";
  const t = (key) => (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || TRANSLATIONS.en[key] || key;
  return <LangContext.Provider value={{ lang, setLang, t, dir }}>{children}</LangContext.Provider>;
}

function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <button
      onClick={() => setLang(lang === "en" ? "ar" : "en")}
      style={{
        background: "rgba(255,255,255,0.12)", border: `1px solid ${BRAND.gold}`, borderRadius: 999,
        padding: "6px 12px", color: BRAND.cream, fontWeight: 700, fontSize: 12.5, cursor: "pointer",
        fontFamily: lang === "ar" ? "Cairo, sans-serif" : "Manrope, sans-serif",
      }}
    >
      {lang === "en" ? "العربية" : "English"}
    </button>
  );
}

/* Category name + product name translations. Keyed by the existing English
   name/category used everywhere else in the app (ids, Firestore docs, cart,
   orders all stay in English/slug form — only the displayed label changes). */
const CATEGORY_NAME_AR = {
  "Everyday Essentials": "أساسيات يومية",
  "Bulbs": "الأبصال",
  "Leafy Greens": "الورقيات الخضراء",
  "Fresh Herbs": "الأعشاب الطازجة",
  "Brassicas": "الكرنبيات",
  "Beans & Peas": "الفول والبازلاء",
  "Mushrooms": "الفطر",
  "Specialty Vegetables": "خضروات مميزة",
  "Middle Eastern Favorites": "أطباق شرق أوسطية مفضلة",
  "Fruits": "الفواكه",
  "Gourmet & Gifts": "أطعمة فاخرة وهدايا",
  "Frozen Foods": "أطعمة مجمدة",
};
const PRODUCT_NAME_AR = {
  "Tomato": "طماطم", "Cherry Tomato": "طماطم كرزية", "Cucumber": "خيار",
  "Bell Pepper (Red)": "فلفل حلو أحمر", "Bell Pepper (Green)": "فلفل حلو أخضر", "Bell Pepper (Yellow)": "فلفل حلو أصفر",
  "Potato": "بطاطا", "Carrot": "جزر", "Eggplant": "باذنجان", "Zucchini": "كوسا",
  "Lemon": "ليمون", "Chili Pepper": "فلفل حار", "Green Chili": "فلفل أخضر حار", "Jalapeno": "هالبينو", "Sweet Potato": "بطاطا حلوة", "Beetroot": "شمندر", "Bell Pepper (Orange)": "فلفل حلو برتقالي", "Baby Eggplant": "باذنجان صغير", "Baby Potato": "بطاطا صغيرة", "Mini Cucumber": "خيار صغير", "Yellow Squash": "كوسا صفراء", "Red Radish": "فجل أحمر", "White Radish": "فجل أبيض", "Pumpkin": "يقطين", "Turnip": "لفت", "Parsnip": "جزر أبيض", "Okra": "بامية",
  "Yellow Onion": "بصل أصفر", "Red Onion": "بصل أحمر", "White Onion": "بصل أبيض",
  "Shallots": "بصل شالوت", "Garlic": "ثوم", "Fresh Garlic": "ثوم أخضر طازج",
  "Lettuce (Iceberg)": "خس أيسبرغ", "Romaine Lettuce": "خس روماني", "Green Leaf Lettuce": "خس أوراق خضراء",
  "Red Leaf Lettuce": "خس أوراق حمراء", "Spinach": "سبانخ", "Kale": "كرنب أجعد",
  "Swiss Chard": "سلق", "Rocket (Arugula)": "جرجير", "Watercress": "جرجير الماء",
  "Parsley": "بقدونس", "Coriander (Cilantro)": "كزبرة", "Mint": "نعناع",
  "Dill": "شبت", "Celery": "كرفس", "Basil": "ريحان",
  "Thyme": "زعتر أخضر", "Rosemary": "إكليل الجبل", "Sage": "مريمية", "Oregano": "أوريجانو",
  "Broccoli": "بروكلي", "Cauliflower": "قرنبيط", "White Cabbage": "ملفوف أبيض",
  "Red Cabbage": "ملفوف أحمر", "Chinese Cabbage": "ملفوف صيني", "Brussels Sprouts": "كرنب بروكسل",
  "Green Beans": "فاصولياء خضراء", "French Beans": "فاصولياء فرنسية", "Snow Peas": "بازلاء ثلجية",
  "Sugar Snap Peas": "بازلاء سكرية", "Green Peas": "بازلاء خضراء", "Broad Beans (Fava)": "فول أخضر",
  "White Mushroom": "فطر أبيض", "Brown Mushroom": "فطر بني", "Portobello": "فطر بورتوبيلو",
  "Oyster Mushroom": "فطر المحار", "Shiitake": "فطر شيتاكي",
  "Asparagus": "هليون", "Artichoke": "خرشوف", "Leek": "كراث",
  "Fennel": "شمر", "Celeriac": "كرفس درني", "Rhubarb (Seasonal)": "راوند (موسمي)",
  "Corn": "ذرة", "Baby Corn": "ذرة صغيرة",
  "Molokhia": "ملوخية", "Vine Leaves": "ورق عنب", "Purslane": "بقلة",
  "Green Fava Beans": "فول أخضر بالقشرة", "Fresh Broad Beans": "فول طازج",
  "Kousa (Light Green Zucchini)": "كوسا", "Green Almonds (Seasonal)": "لوز أخضر (موسمي)",
  "Apple": "تفاح", "Banana": "موز", "Orange": "برتقال", "Grapes (Red)": "عنب أحمر", "Grapes (Green)": "عنب أخضر",
  "Strawberry": "فراولة", "Mango": "مانجو", "Kiwi": "كيوي", "Pineapple": "أناناس",
  "Pomegranate": "رمان", "Pear": "كمثرى", "Honey Peach": "خوخ عسلي", "Dragon Fruit": "فاكهة التنين", "Mandarin": "يوسفي", "Blueberries": "توت أزرق", "3 Colour Apples": "تفاح ثلاثي الألوان", "Cherry": "كرز", "Flat Peach": "خوخ مفلطح", "Blackberry": "توت أسود", "Raspberry": "توت العليق", "Apricot": "مشمش", "Kibbeh": "كبة", "Meat Sambousek": "سمبوسة لحمة", "Cheese Sambousek": "سمبوسة جبنة", "Artisanal Spice Collection": "مجموعة توابل حرفية", "Sidr Honey & Fig Preserves Set": "طقم عسل السدر ومربى التين", "Honey Jar": "برطمان عسل", "Zaatar Trio Box": "علبة زعتر ثلاثية", "Premium Mixed Nuts Gift Box": "علبة هدايا مكسرات فاخرة", "Premium Extra Virgin Olive Oil": "زيت زيتون بكر ممتاز فاخر",
};
const UNIT_AR = { kg: "كغم", bunch: "حزمة", piece: "قطعة", "250g": "٢٥٠ غم", box: "صندوق", set: "طقم" };
const BOX_NAME_AR = {
  "🌿 Daily Box": "🌿 الصندوق اليومي",
  "🏡 Family Box": "🏡 صندوق العائلة",
  "👑 Signature Box": "👑 الصندوق المميز",
  "🥗 Chef's Box": "🥗 صندوق الشيف",
  "🪵 Wooden Crate": "🪵 صندوق خشبي",
  "💐 Luxury Box": "💐 الصندوق الفاخر",
  "🎁 Signature Gift Box": "🎁 صندوق الهدايا المميز",
};
const BOX_TAG_AR = {
  "A light everyday refresh": "تجديد يومي خفيف",
  "Perfect for families": "مثالي للعائلات",
  "For premium & VIP clients": "لعملاء الفئة المميزة",
  "For chefs, caterers & entertaining": "للطهاة ومقدمي خدمات التموين والاستضافة",
};
const BOX_BLURB_AR = {
  "Everyday essentials in our signature matte box with gold foil logo.": "أساسيات يومية في صندوقنا المميز بلمسة نهائية غير لامعة وشعار ذهبي.",
  "A fuller restock of vegetables and greens, packed for the week.": "تجديد أوفر من الخضروات والورقيات، مُعبأ ليكفي أسبوعًا كاملًا.",
  "Our rigid gift box with magnetic closure and ribbon handles, for entertaining or gifting.": "صندوق هدايا صلب بإغلاق مغناطيسي ومقابض شريطية، مثالي للاستضافة أو الإهداء.",
  "Our largest box — bulk vegetables and fresh herbs for serious cooking, catering, or hosting a crowd.": "أكبر صناديقنا — خضروات وأعشاب طازجة بكميات كبيرة للطهي الجاد أو التموين أو استضافة عدد كبير من الضيوف.",
};
function catName(cat, lang) {
  return lang === "ar" ? (CATEGORY_NAME_AR[cat] || cat) : cat;
}
function prodName(name, lang) {
  return lang === "ar" ? (PRODUCT_NAME_AR[name] || name) : name;
}
function unitName(unit, lang) {
  return lang === "ar" ? (UNIT_AR[unit] || unit) : unit;
}
function boxName(name, lang) {
  return lang === "ar" ? (BOX_NAME_AR[name] || name) : name;
}
function boxTag(tag, lang) {
  return lang === "ar" ? (BOX_TAG_AR[tag] || tag) : tag;
}
function boxBlurb(blurb, lang) {
  return lang === "ar" ? (BOX_BLURB_AR[blurb] || blurb) : blurb;
}
/* For customized fixed-piece fruit boxes: turns a breakdown like
   [{name:"Apple", qty:2},{name:"Banana", qty:3}] into a readable "2 Apple, 3 Banana"
   used in the cart, checkout, invoice, admin views, and WhatsApp/email text. */
function breakdownText(item, lang) {
  if (!item || !item.breakdown || item.breakdown.length === 0) return "";
  return item.breakdown.map((b) => `${b.qty} ${prodName(b.name, lang)}`).join(lang === "ar" ? "، " : ", ");
}
// Total physical fruit count in a box breakdown — worth showing separately
// from the list itself, since a box's fixed "piece count" (its slots) can
// now differ from the actual number of fruits inside once sets-of-3 items
// are involved (e.g. an 8-slot box can easily hold 14 real pieces of fruit).
function breakdownTotalPieces(item) {
  if (!item || !item.breakdown) return 0;
  return item.breakdown.reduce((s, b) => s + b.qty, 0);
}
/* The price actually charged for a product — its salePrice when a discount
   is set and genuinely lower than the regular price, otherwise the regular
   price. Centralized here so display and cart/checkout can never disagree
   about what a discounted item costs. */
function effectivePrice(product) {
  return typeof product.salePrice === "number" && product.salePrice > 0 && product.salePrice < product.price
    ? product.salePrice
    : product.price;
}
// Same idea as effectivePrice, but for fixed-price boxes (Daily/Family/
// Fruit/Frozen boxes) — kept as its own function since boxes are a
// separate data shape from catalog products, not because the logic differs.
function effectiveBoxPrice(box) {
  return typeof box.salePrice === "number" && box.salePrice > 0 && box.salePrice < box.price
    ? box.salePrice
    : box.price;
}
function productDescription(product, lang) {
  return (lang === "ar" ? product.descriptionAr : product.description) || null;
}


/* ---------------------------------- Logo ---------------------------------- */

function Logo({ size = 44, onDark = false, plain = false }) {
  // Real logo mark, cropped directly from the brand book (leaf + wordmark +
  // tagline), instead of a hand-drawn recreation. Native aspect ratio ~3:2.
  return (
    <img
      src={REAL_LOGO_IMG}
      alt="Darousha Fresh logo"
      style={{ width: size, height: "auto", display: "block", borderRadius: 8 }}
    />
  );
}

function Wordmark({ onDark = false, size = "md", center = false }) {
  const color = onDark ? BRAND.cream : BRAND.greenDark;
  const gold = BRAND.gold;
  const scale = size === "lg" ? 1.7 : size === "sm" ? 0.74 : 1;
  return (
    <div style={{ lineHeight: 1.05, textAlign: center ? "center" : "left" }}>
      <div
        style={{
          fontFamily: "Playfair Display, serif",
          fontWeight: 800,
          fontSize: 19 * scale,
          color,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        Darousha
      </div>
      <div
        style={{
          fontFamily: "Playfair Display, serif",
          fontWeight: 500,
          fontStyle: "italic",
          fontSize: 13.5 * scale,
          color: gold,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          marginTop: -2,
        }}
      >
        Fresh
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, justifyContent: center ? "center" : "flex-start" }}>
        <span style={{ width: 14, height: 1, background: gold, opacity: 0.7 }} />
        <span
          style={{
            fontFamily: "IBM Plex Mono, monospace",
            fontSize: 8.6 * scale,
            letterSpacing: "0.2em",
            color: onDark ? BRAND.creamDeep : BRAND.green,
            textTransform: "uppercase",
            opacity: 0.85,
          }}
        >
          Premium Fresh Produce
        </span>
        <span style={{ width: 14, height: 1, background: gold, opacity: 0.7 }} />
      </div>
    </div>
  );
}

/* --------------------------------- Produce icon --------------------------------- */
/* Small deterministic SVG "produce mark" per item, drawn from primitive shapes so
   every product has a real, on-brand illustration without external images. */

function ProduceIcon({ name, category, size = 56 }) {
  const seed = useMemo(() => hashStr(name), [name]);
  const hue = seed % 360;
  const palette = pickPalette(category, name);
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill={palette.bg} />
      {renderShape(name, category, palette)}
    </svg>
  );
}

/* Real product photos we cropped from the Darousha Fresh brand book — used
   wherever we have a genuine photo of that item; every other SKU falls back
   to the illustrated mark above until real photography is supplied for it. */
const REAL_PHOTOS = {}; // populated below, after image constants are declared
function Thumb({ product, size = 56, radius = 12 }) {
  const photo = product.photoUrl || REAL_PHOTOS[product.id];
  if (photo) {
    // Only watermark at sizes where it actually reads clearly — on a 32px
    // cart-row thumbnail it would just be visual noise, not a real mark.
    const showWatermark = size >= 100;
    return (
      <div style={{ position: "relative", width: size, height: size, borderRadius: radius, overflow: "hidden" }}>
        <img
          src={photo}
          alt={product.name}
          style={{ width: size, height: size, objectFit: "cover", borderRadius: radius, display: "block" }}
        />
        {showWatermark && (
          <img
            src={WATERMARK_LOGO_IMG}
            alt=""
            style={{
              position: "absolute", right: "4%", bottom: "4%", width: "30%", height: "auto",
              opacity: 0.6, pointerEvents: "none", userSelect: "none",
            }}
          />
        )}
      </div>
    );
  }
  return <ProduceIcon name={product.name} category={product.category} size={size} />;
}

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function pickPalette(category, name) {
  const n = name.toLowerCase();
  if (n.includes("tomato")) return { bg: "#F7DCD3", body: "#C4432E", accent: "#5C7A3F" };
  if (n.includes("lemon")) return { bg: "#FBF0C9", body: "#E9C441", accent: "#8AA43F" };
  if (n.includes("carrot")) return { bg: "#FBE2C8", body: "#E2812F", accent: "#5C7A3F" };
  if (n.includes("beetroot")) return { bg: "#EBD3DA", body: "#7C2136", accent: "#5C7A3F" };
  if (n.includes("pepper") || n.includes("chili")) return { bg: "#F7DFCB", body: n.includes("green") ? "#5C8A3C" : n.includes("yellow") ? "#E7C13B" : "#C4432E", accent: "#3E6B2A" };
  if (n.includes("onion") || n.includes("shallot") || n.includes("garlic")) return { bg: "#F1E3D2", body: n.includes("red") ? "#8A4B6B" : "#E8DCC0", accent: "#B48A4B" };
  if (n.includes("mushroom")) return { bg: "#EDE3D6", body: "#B78A5E", accent: "#7C5B3C" };
  if (category === "Fresh Herbs" || category === "Leafy Greens" || n.includes("cabbage") || n.includes("broccoli") || n.includes("kale") || n.includes("spinach")) return { bg: "#E1EBD9", body: "#3E7A3F", accent: "#255627" };
  if (n.includes("potato")) return { bg: "#EDE1CC", body: "#C79A5F", accent: "#8A6635" };
  if (n.includes("eggplant")) return { bg: "#E4DAEA", body: "#513A6B", accent: "#3E7A3F" };
  if (n.includes("corn")) return { bg: "#FAF0C6", body: "#E9C441", accent: "#7A6B27" };
  if (n.includes("sambousek") || n.includes("kibbeh")) return { bg: "#F1E3D2", body: "#C79A5F", accent: "#8A6635" };
  return { bg: BRAND.greenSoft, body: BRAND.green, accent: BRAND.orange };
}

function renderShape(name, category, p) {
  const n = name.toLowerCase();
  const leafTop = <path d="M32 10 q4 4 2 10 q-4-2-6 2 q1-8 4-12Z" fill={p.accent} />;
  if (n.includes("lemon")) return (<g>{leafTop}<ellipse cx="32" cy="34" rx="14" ry="11" fill={p.body} /></g>);
  if (n.includes("carrot")) return (<g><path d="M32 12 L37 12 L34 46 L30 46 Z" fill={p.body} /><path d="M32 12 q-6-8-1-10 q3 5 1 10Z M32 12 q6-8 1-10 q-3 5-1 10Z" fill={p.accent} /></g>);
  if (n.includes("beetroot")) return (<g>{leafTop}<circle cx="32" cy="36" r="13" fill={p.body} /></g>);
  if (n.includes("tomato") && !n.includes("cherry")) return (<g><circle cx="32" cy="34" r="14" fill={p.body} /><path d="M32 21 l-4 4 4-1 4 1Z" fill={p.accent} /></g>);
  if (n.includes("cherry tomato")) return (<g><circle cx="24" cy="30" r="8" fill={p.body} /><circle cx="38" cy="36" r="8" fill={p.body} /><circle cx="30" cy="42" r="7" fill={p.body} /></g>);
  if (n.includes("cucumber") || n.includes("zucchini") || n.includes("kousa")) return (<g><rect x="18" y="24" width="28" height="16" rx="8" fill={p.body} /></g>);
  if (n.includes("pepper") || n.includes("chili")) return (<g><path d="M40 18 q6 4 2 10 q-14 4-16 16 q-4-14 6-22 q4-3 8-4Z" fill={p.body} /><path d="M40 18 l4-4" stroke={p.accent} strokeWidth="3" strokeLinecap="round" /></g>);
  if (n.includes("onion")) return (<g><path d="M32 14 q10 4 10 18 q0 12-10 14 q-10-2-10-14 q0-14 10-18Z" fill={p.body} /><path d="M32 14 l0-6" stroke={p.accent} strokeWidth="2" /></g>);
  if (n.includes("garlic")) return (<g><ellipse cx="26" cy="34" rx="7" ry="9" fill={p.body} /><ellipse cx="38" cy="34" rx="7" ry="9" fill={p.body} /><path d="M32 22 l0-8" stroke={p.accent} strokeWidth="2" /></g>);
  if (n.includes("shallot")) return (<g><ellipse cx="32" cy="34" rx="9" ry="12" fill={p.body} /></g>);
  if (n.includes("mushroom")) return (<g><rect x="27" y="32" width="10" height="14" rx="3" fill="#EDE3D6" /><path d="M18 30 q14-16 28 0 q-14 6-28 0Z" fill={p.body} /></g>);
  if (n.includes("potato")) return (<g><ellipse cx="32" cy="34" rx="15" ry="11" fill={p.body} /></g>);
  if (n.includes("eggplant")) return (<g><path d="M28 16 q6-2 8 2" stroke={p.accent} strokeWidth="3" fill="none" strokeLinecap="round" /><path d="M32 18 q14 4 10 20 q-4 12-14 12 q-10 0-12-12 q-2-16 16-20Z" fill={p.body} /></g>);
  if (n.includes("corn")) return (<g><path d="M32 12 l-3 8" stroke={p.accent} strokeWidth="3" strokeLinecap="round" /><rect x="22" y="18" width="20" height="28" rx="9" fill={p.body} /></g>);
  if (n.includes("broccoli") || n.includes("cauliflower")) return (<g><circle cx="24" cy="26" r="8" fill={p.body} /><circle cx="34" cy="22" r="9" fill={p.body} /><circle cx="40" cy="30" r="7" fill={p.body} /><rect x="28" y="30" width="8" height="14" rx="3" fill={p.accent} /></g>);
  if (n.includes("cabbage")) return (<g><circle cx="32" cy="32" r="16" fill={p.body} /><circle cx="32" cy="32" r="10" fill="none" stroke={p.accent} strokeWidth="1.6" /><circle cx="32" cy="32" r="5" fill="none" stroke={p.accent} strokeWidth="1.4" /></g>);
  if (n.includes("lettuce") || n.includes("kale") || n.includes("chard") || n.includes("rocket") || n.includes("arugula") || n.includes("watercress") || n.includes("spinach") || n.includes("molokhia") || n.includes("purslane")) return (<g><path d="M32 46 q-16 0-16-18 q8 2 16 12 q8-10 16-12 q0 18-16 18Z" fill={p.body} /></g>);
  if (n.includes("brussels")) return (<g><circle cx="24" cy="26" r="7" fill={p.body} /><circle cx="40" cy="26" r="7" fill={p.body} /><circle cx="24" cy="40" r="7" fill={p.body} /><circle cx="40" cy="40" r="7" fill={p.body} /></g>);
  if (n.includes("bean") || n.includes("pea")) return (<g><path d="M18 40 q0-22 26-24 q4 6-2 10 q-16 4-16 26 q-8-2-8-12Z" fill={p.body} /></g>);
  if (n.includes("asparagus")) return (<g><rect x="22" y="16" width="4" height="30" fill={p.body} /><rect x="30" y="12" width="4" height="34" fill={p.body} /><rect x="38" y="18" width="4" height="28" fill={p.body} /><path d="M22 16l4 4M30 12l4 4M38 18l4 4" stroke={p.accent} strokeWidth="2" /></g>);
  if (n.includes("artichoke")) return (<g><path d="M32 14 C44 16 46 30 40 40 C36 46 28 46 24 40 C18 30 20 16 32 14Z" fill={p.body} /><path d="M32 14v-4" stroke={p.accent} strokeWidth="2" /></g>);
  if (n.includes("leek")) return (<g><rect x="27" y="14" width="10" height="20" fill={p.accent} /><rect x="24" y="30" width="16" height="16" rx="4" fill="#EDE3D6" /></g>);
  if (n.includes("fennel") || n.includes("celeriac") || n.includes("celery")) return (<g><path d="M20 44 q6-20 12-30 M32 44 q0-22 0-32 M44 44 q-6-20-12-30" stroke={p.accent} strokeWidth="3" fill="none" strokeLinecap="round" /><rect x="20" y="40" width="24" height="8" rx="4" fill="#EDE3D6" /></g>);
  if (n.includes("rhubarb")) return (<g><path d="M32 44 L28 16" stroke={p.tomato || "#B23B2E"} strokeWidth="4" strokeLinecap="round" /><path d="M28 16 q-10-2-10 10 q10 4 14-6Z" fill={p.body} /></g>);
  if (n.includes("almond")) return (<g><ellipse cx="26" cy="30" rx="7" ry="10" fill={p.body} /><ellipse cx="38" cy="34" rx="7" ry="10" fill={p.body} /></g>);
  if (n.includes("vine leaves")) return (<g><path d="M32 14 C44 18 44 30 32 46 C20 30 20 18 32 14Z" fill={p.body} /><path d="M32 14v32" stroke={p.accent} strokeWidth="1.4" /></g>);
  if (n.includes("sambousek")) return (<g><path d="M32 14 L48 42 L16 42 Z" fill={p.body} /><path d="M32 14 L48 42 L16 42 Z" fill="none" stroke={p.accent} strokeWidth="1.6" /></g>);
  if (n.includes("kibbeh")) return (<g><ellipse cx="32" cy="30" rx="9" ry="16" fill={p.body} /><path d="M32 16 q-4 4 0 8 M32 36 q4 4 0 8" stroke={p.accent} strokeWidth="1.4" fill="none" /></g>);
  // herbs / fallback bouquet
  return (
    <g>
      <path d="M32 46 L32 22" stroke={p.accent} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M32 22 q-10-2-12 8 M32 26 q10-2 12 8 M32 30 q-8-1-9 7" stroke={p.body} strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </g>
  );
}

/* ------------------------------------ Data ------------------------------------ */

const CATALOG = [
  { cat: "Everyday Essentials", items: [
    ["Tomato","kg",5],["Cherry Tomato","kg",12],["Cucumber","kg",4],
    ["Bell Pepper (Red)","kg",9],["Bell Pepper (Green)","kg",7],["Bell Pepper (Yellow)","kg",9],["Bell Pepper (Orange)","kg",9],
    ["Potato","kg",3],["Carrot","kg",4],["Eggplant","kg",5],["Zucchini","kg",6],
    ["Lemon","kg",6],["Chili Pepper","kg",10],["Green Chili","kg",9],["Jalapeno","kg",11],["Sweet Potato","kg",6],["Beetroot","kg",5],
    ["Baby Eggplant","kg",7],["Baby Potato","kg",5],["Mini Cucumber","kg",6],["Yellow Squash","kg",7],
    ["Red Radish","bunch",4],["White Radish","kg",5],
  ]},
  { cat: "Bulbs", items: [
    ["Yellow Onion","kg",3],["Red Onion","kg",4],["White Onion","kg",4],
    ["Shallots","kg",12],["Garlic","kg",14],["Fresh Garlic","bunch",6],
  ]},
  { cat: "Leafy Greens", items: [
    ["Lettuce (Iceberg)","piece",4],["Romaine Lettuce","piece",5],["Green Leaf Lettuce","piece",5],
    ["Red Leaf Lettuce","piece",6],["Spinach","bunch",4],["Kale","bunch",7],
    ["Swiss Chard","bunch",6],["Rocket (Arugula)","bunch",5],["Watercress","bunch",6],
  ]},
  { cat: "Fresh Herbs", items: [
    ["Parsley","bunch",2],["Coriander (Cilantro)","bunch",2],["Mint","bunch",3],
    ["Dill","bunch",3],["Celery","bunch",4],["Basil","bunch",5],
    ["Thyme","bunch",4],["Rosemary","bunch",4],["Sage","bunch",4],["Oregano","bunch",4],
  ]},
  { cat: "Brassicas", items: [
    ["Broccoli","kg",9],["Cauliflower","kg",7],["White Cabbage","kg",4],
    ["Red Cabbage","kg",6],["Chinese Cabbage","kg",6],["Brussels Sprouts","kg",14],
  ]},
  { cat: "Beans & Peas", items: [
    ["Green Beans","kg",9],["French Beans","kg",11],["Snow Peas","kg",16],
    ["Sugar Snap Peas","kg",16],["Green Peas","kg",10],["Broad Beans (Fava)","kg",9],
  ]},
  { cat: "Mushrooms", items: [
    ["White Mushroom","250g",9],["Brown Mushroom","250g",10],["Portobello","250g",13],
    ["Oyster Mushroom","250g",15],["Shiitake","250g",18],
  ]},
  { cat: "Specialty Vegetables", items: [
    ["Asparagus","bunch",16],["Artichoke","piece",6],["Leek","kg",7],
    ["Fennel","kg",8],["Celeriac","kg",7],["Rhubarb (Seasonal)","kg",12],
    ["Corn","piece",3],["Baby Corn","kg",14],["Pumpkin","kg",6],["Turnip","kg",5],["Parsnip","kg",8],
  ]},
  { cat: "Middle Eastern Favorites", items: [
    ["Molokhia","bunch",5],["Vine Leaves","250g",10],["Purslane","bunch",4],
    ["Green Fava Beans","kg",9],["Fresh Broad Beans","kg",9],["Okra","kg",9],
    ["Kousa (Light Green Zucchini)","kg",7],["Green Almonds (Seasonal)","kg",15],
  ]},
  { cat: "Fruits", items: [
    ["Apple","piece",3],["Banana","piece",2],["Orange","piece",3],
    ["Grapes (Red)","piece",14],["Grapes (Green)","piece",14],["Strawberry","piece",12],
    ["Mango","piece",6],["Kiwi","piece",3],
    ["Pineapple","piece",12],["Pomegranate","piece",8],["Pear","piece",4],
    ["Honey Peach","piece",5],["Dragon Fruit","piece",15],
    ["Mandarin","piece",3],["Blueberries","box",15],["3 Colour Apples","set",8],
    ["Cherry","box",18],["Flat Peach","piece",6],["Blackberry","box",16],
    ["Raspberry","box",16],["Apricot","piece",5],
  ]},
  { cat: "Gourmet & Gifts", items: [
    ["Artisanal Spice Collection","piece",145],["Sidr Honey & Fig Preserves Set","piece",110],
    ["Honey Jar","piece",45],["Zaatar Trio Box","piece",65],["Premium Mixed Nuts Gift Box","piece",120],
    ["Premium Extra Virgin Olive Oil","piece",55],
  ]},
  { cat: "Frozen Foods", items: [
    ["Kibbeh","piece",4],["Meat Sambousek","piece",3],["Cheese Sambousek","piece",3],
  ]},
];

/* Recipe brochure — real produce ingredients matched to the actual catalog,
   so every ingredient listed is genuinely orderable. Pantry items (bulgur,
   olive oil, etc.) are called out separately since we only sell produce. */
const RECIPES = [
  {
    id: "fattoush",
    name: "Fattoush Salad", nameAr: "سلطة فتوش",
    tagline: "Crisp, tangy Levantine bread salad", taglineAr: "سلطة خبز شامية منعشة وحامضة",
    produce: ["Romaine Lettuce", "Tomato", "Cucumber", "Bell Pepper (Green)", "Purslane", "Parsley", "Mint", "Shallots", "Garlic", "Lemon"],
    pantry: ["Toasted or fried pita bread", "Sumac", "Pomegranate molasses", "Olive oil", "Salt"],
    pantryAr: ["خبز محمص أو مقلي", "سماق", "دبس رمان", "زيت زيتون", "ملح"],
    steps: [
      "Chop the romaine, tomato, cucumber, bell pepper and shallots into bite-size pieces.",
      "Add the purslane, parsley and mint leaves.",
      "Whisk lemon juice, pomegranate molasses, olive oil, crushed garlic and sumac for the dressing.",
      "Toss everything together and top with broken toasted pita just before serving.",
    ],
    stepsAr: [
      "قطّعي الخس والطماطم والخيار والفلفل والشالوت إلى قطع صغيرة.",
      "أضيفي البقلة والبقدونس والنعناع.",
      "اخفقي عصير الليمون ودبس الرمان وزيت الزيتون والثوم المهروس والسماق لعمل التتبيلة.",
      "اخلطي كل شيء معًا وأضيفي الخبز المحمص المكسر قبل التقديم مباشرة.",
    ],
  },
  {
    id: "tabbouleh",
    name: "Tabbouleh", nameAr: "تبولة",
    tagline: "Herb-forward parsley & tomato salad", taglineAr: "سلطة بقدونس وطماطم غنية بالأعشاب",
    produce: ["Parsley", "Mint", "Tomato", "Shallots", "Lemon"],
    pantry: ["Fine bulgur wheat", "Olive oil", "Salt"],
    pantryAr: ["برغل ناعم", "زيت زيتون", "ملح"],
    steps: [
      "Soak the bulgur in water for 15 minutes, then drain well.",
      "Finely chop the parsley, mint, tomato and shallots.",
      "Combine with the bulgur, lemon juice, olive oil and salt.",
      "Chill for at least 30 minutes before serving for the best flavor.",
    ],
    stepsAr: [
      "انقعي البرغل في الماء لمدة ١٥ دقيقة ثم صفّيه جيدًا.",
      "قطّعي البقدونس والنعناع والطماطم والشالوت ناعمًا.",
      "امزجي مع البرغل وعصير الليمون وزيت الزيتون والملح.",
      "برّدي لمدة ٣٠ دقيقة على الأقل قبل التقديم للحصول على أفضل نكهة.",
    ],
  },
  {
    id: "molokhia",
    name: "Molokhia", nameAr: "ملوخية",
    tagline: "Classic Middle Eastern green stew", taglineAr: "طبخة خضراء شرق أوسطية كلاسيكية",
    produce: ["Molokhia", "Garlic", "Coriander (Cilantro)", "Lemon"],
    pantry: ["Chicken or vegetable stock", "Ghee or oil", "Rice, to serve"],
    pantryAr: ["مرق دجاج أو خضار", "سمن أو زيت", "أرز للتقديم"],
    steps: [
      "Finely chop the molokhia leaves (or use a food processor).",
      "Sauté crushed garlic and chopped coriander in ghee until fragrant.",
      "Add the molokhia and stock, simmer gently for 10–15 minutes.",
      "Finish with a squeeze of lemon and serve hot over rice.",
    ],
    stepsAr: [
      "قطّعي أوراق الملوخية ناعمًا (أو استخدمي محضر الطعام).",
      "حمّري الثوم المهروس والكزبرة المفرومة في السمن حتى تفوح الرائحة.",
      "أضيفي الملوخية والمرق واتركيها على نار هادئة ١٠-١٥ دقيقة.",
      "أنهيها بعصير الليمون وقدميها ساخنة مع الأرز.",
    ],
  },
  {
    id: "warak-enab",
    name: "Stuffed Vine Leaves", nameAr: "ورق عنب محشي",
    tagline: "Rice-stuffed grape leaves, warak enab", taglineAr: "ورق عنب محشو بالأرز",
    produce: ["Vine Leaves", "Tomato", "Garlic", "Mint", "Lemon"],
    pantry: ["Short-grain rice", "Olive oil", "Salt & pepper"],
    pantryAr: ["أرز قصير الحبة", "زيت زيتون", "ملح وفلفل"],
    steps: [
      "Mix rice with finely diced tomato, chopped mint, olive oil and seasoning for the filling.",
      "Lay out vine leaves and spoon a little filling onto each; roll tightly.",
      "Layer the rolls in a pot with sliced garlic and lemon slices.",
      "Cover with water, weigh down with a plate, and simmer for 45 minutes.",
    ],
    stepsAr: [
      "اخلطي الأرز مع الطماطم المقطّعة ناعمًا والنعناع المفروم وزيت الزيتون والتوابل للحشو.",
      "افردي ورق العنب وضعي القليل من الحشو على كل ورقة ولفّيها بإحكام.",
      "رصّي اللفائف في قدر مع شرائح الثوم والليمون.",
      "غطّي بالماء وثقّلي بطبق واتركيها تُطهى على نار هادئة ٤٥ دقيقة.",
    ],
  },
  {
    id: "roasted-veg",
    name: "Roasted Mediterranean Vegetables", nameAr: "خضروات متوسطية مشوية",
    tagline: "Simple oven-roasted vegetable medley", taglineAr: "تشكيلة خضروات مشوية بالفرن بسهولة",
    produce: ["Zucchini", "Eggplant", "Bell Pepper (Red)", "Bell Pepper (Yellow)", "Red Onion", "Garlic", "Rosemary", "Thyme"],
    pantry: ["Olive oil", "Salt & pepper"],
    pantryAr: ["زيت زيتون", "ملح وفلفل"],
    steps: [
      "Chop the zucchini, eggplant, bell peppers and red onion into large chunks.",
      "Toss with olive oil, whole garlic cloves, rosemary and thyme.",
      "Spread on a tray and roast at 200°C for 25–30 minutes, turning once.",
      "Serve warm as a side, or tossed through pasta or grains.",
    ],
    stepsAr: [
      "قطّعي الكوسا والباذنجان والفلفل الرومي والبصل الأحمر إلى قطع كبيرة.",
      "اخلطيها مع زيت الزيتون وفصوص الثوم كاملة وإكليل الجبل والزعتر.",
      "افردي الخليط على صينية واشويه على ٢٠٠ درجة مئوية لمدة ٢٥-٣٠ دقيقة مع التقليب مرة.",
      "قدميها دافئة كطبق جانبي، أو مع المعكرونة أو الحبوب.",
    ],
  },
  {
    id: "greek-salad",
    name: "Classic Greek Salad", nameAr: "سلطة يونانية كلاسيكية",
    tagline: "Fresh tomato, cucumber & onion salad", taglineAr: "سلطة طماطم وخيار وبصل منعشة",
    produce: ["Tomato", "Cucumber", "Bell Pepper (Green)", "Red Onion"],
    pantry: ["Feta cheese", "Kalamata olives", "Olive oil", "Oregano"],
    pantryAr: ["جبنة فيتا", "زيتون كالاماتا", "زيت زيتون", "أوريغانو"],
    steps: [
      "Cut the tomato, cucumber and bell pepper into large chunks.",
      "Thinly slice the red onion and combine with the vegetables.",
      "Top with olives and a block (not crumbled) of feta cheese.",
      "Drizzle with olive oil and a good pinch of dried oregano.",
    ],
    stepsAr: [
      "قطّعي الطماطم والخيار والفلفل الرومي إلى قطع كبيرة.",
      "قطّعي البصل الأحمر شرائح رفيعة وامزجيه مع الخضروات.",
      "أضيفي الزيتون وقطعة كاملة (غير مفتتة) من جبنة الفيتا.",
      "رشّي زيت الزيتون وكمية جيدة من الأوريغانو المجفف.",
    ],
  },
  {
    id: "baba-ghanoush",
    name: "Baba Ghanoush", nameAr: "بابا غنوج",
    tagline: "Smoky roasted eggplant dip", taglineAr: "متبّل باذنجان مشوي بنكهة مدخنة",
    produce: ["Eggplant", "Garlic", "Lemon", "Parsley"],
    pantry: ["Tahini", "Olive oil", "Salt"],
    pantryAr: ["طحينة", "زيت زيتون", "ملح"],
    steps: [
      "Char the whole eggplant directly over a flame or under a hot grill until the skin blackens and the inside is soft.",
      "Let it cool, then peel and mash the flesh.",
      "Mix with crushed garlic, tahini, lemon juice and salt.",
      "Top with chopped parsley and a drizzle of olive oil before serving.",
    ],
    stepsAr: [
      "اشوي الباذنجان كاملًا مباشرة على النار أو تحت الشواية الساخنة حتى تسودّ القشرة ويصبح الداخل طريًا.",
      "اتركيه ليبرد ثم قشّريه واهرسي اللب.",
      "امزجيه مع الثوم المهروس والطحينة وعصير الليمون والملح.",
      "أضيفي البقدونس المفروم ورشة زيت زيتون قبل التقديم.",
    ],
  },
  {
    id: "shakshuka",
    name: "Shakshuka", nameAr: "شكشوكة",
    tagline: "Eggs poached in spiced tomato sauce", taglineAr: "بيض مطهو في صلصة طماطم متبّلة",
    produce: ["Tomato", "Bell Pepper (Red)", "Yellow Onion", "Garlic", "Coriander (Cilantro)"],
    pantry: ["Eggs", "Cumin", "Paprika", "Olive oil"],
    pantryAr: ["بيض", "كمون", "بابريكا", "زيت زيتون"],
    steps: [
      "Sauté diced onion and bell pepper in olive oil until soft.",
      "Add crushed garlic, cumin and paprika, then chopped tomato; simmer until it forms a thick sauce.",
      "Make small wells in the sauce and crack in the eggs.",
      "Cover and cook until the egg whites set. Finish with chopped coriander.",
    ],
    stepsAr: [
      "قلّبي البصل والفلفل الرومي المقطّع في زيت الزيتون حتى يطريا.",
      "أضيفي الثوم المهروس والكمون والبابريكا ثم الطماطم المقطّعة، واتركيها تُطهى حتى تتكوّن صلصة سميكة.",
      "اعملي حفرًا صغيرة في الصلصة واكسري البيض بداخلها.",
      "غطّي واطهي حتى يتماسك بياض البيض. أضيفي الكزبرة المفرومة في النهاية.",
    ],
  },
  {
    id: "cucumber-yogurt",
    name: "Cucumber Mint Yogurt Salad", nameAr: "سلطة خيار بلبن ونعناع",
    tagline: "Cooling yogurt salad, khyar bi laban", taglineAr: "سلطة لبن منعشة، خيار بلبن",
    produce: ["Cucumber", "Mint", "Garlic"],
    pantry: ["Plain yogurt", "Salt", "Olive oil"],
    pantryAr: ["لبن زبادي", "ملح", "زيت زيتون"],
    steps: [
      "Finely dice the cucumber.",
      "Mix with plain yogurt, crushed garlic and chopped mint.",
      "Season with salt and a drizzle of olive oil.",
      "Chill before serving alongside grilled dishes or rice.",
    ],
    stepsAr: [
      "قطّعي الخيار ناعمًا.",
      "امزجيه مع اللبن الزبادي والثوم المهروس والنعناع المفروم.",
      "تبّلي بالملح ورشة زيت زيتون.",
      "برّديها قبل التقديم مع الأطباق المشوية أو الأرز.",
    ],
  },
  {
    id: "roasted-cauliflower",
    name: "Roasted Cauliflower with Tahini", nameAr: "قرنبيط مشوي بالطحينة",
    tagline: "Charred cauliflower, tahini drizzle", taglineAr: "قرنبيط محمّص مع صلصة الطحينة",
    produce: ["Cauliflower", "Garlic", "Parsley", "Lemon"],
    pantry: ["Tahini", "Olive oil", "Salt & pepper"],
    pantryAr: ["طحينة", "زيت زيتون", "ملح وفلفل"],
    steps: [
      "Cut the cauliflower into florets and toss with olive oil, salt and pepper.",
      "Roast at 220°C for 25 minutes until charred at the edges.",
      "Whisk tahini with lemon juice, crushed garlic and a little water into a smooth sauce.",
      "Drizzle over the roasted cauliflower and finish with chopped parsley.",
    ],
    stepsAr: [
      "قطّعي القرنبيط إلى زهيرات وقلّبيها مع زيت الزيتون والملح والفلفل.",
      "اشويها على ٢٢٠ درجة مئوية لمدة ٢٥ دقيقة حتى تتحمّص الأطراف.",
      "اخفقي الطحينة مع عصير الليمون والثوم المهروس وقليل من الماء حتى تحصلي على صلصة ناعمة.",
      "اسكبيها فوق القرنبيط المشوي وأضيفي البقدونس المفروم في النهاية.",
    ],
  },
  {
    id: "lentil-soup",
    name: "Lentil Soup", nameAr: "شوربة عدس",
    tagline: "Warm, comforting shorbat adas", taglineAr: "شوربة عدس دافئة ومريحة",
    produce: ["Carrot", "Yellow Onion", "Garlic", "Lemon"],
    pantry: ["Red lentils", "Cumin", "Vegetable stock", "Olive oil"],
    pantryAr: ["عدس أحمر", "كمون", "مرق خضار", "زيت زيتون"],
    steps: [
      "Sauté diced onion, carrot and garlic in olive oil until softened.",
      "Add red lentils, cumin and stock; simmer for 20–25 minutes until the lentils break down.",
      "Blend until smooth (or leave chunky, to taste).",
      "Finish with a squeeze of lemon juice before serving.",
    ],
    stepsAr: [
      "قلّبي البصل والجزر المقطّع والثوم في زيت الزيتون حتى يطريا.",
      "أضيفي العدس الأحمر والكمون والمرق، واتركيها على نار هادئة ٢٠-٢٥ دقيقة حتى يتفتت العدس.",
      "اخلطيها حتى تصبح ناعمة (أو اتركيها كما هي حسب الرغبة).",
      "أضيفي عصير الليمون في النهاية قبل التقديم.",
    ],
  },
  {
    id: "sauteed-spinach",
    name: "Sautéed Spinach with Garlic", nameAr: "سبانخ سوتيه بالثوم",
    tagline: "Simple, quick garlicky spinach", taglineAr: "سبانخ سريعة بنكهة الثوم",
    produce: ["Spinach", "Garlic", "Lemon", "Yellow Onion"],
    pantry: ["Olive oil", "Salt & pepper"],
    pantryAr: ["زيت زيتون", "ملح وفلفل"],
    steps: [
      "Sauté sliced onion in olive oil until soft.",
      "Add crushed garlic and cook for 30 seconds until fragrant.",
      "Add the spinach in batches, stirring until just wilted.",
      "Season and finish with a squeeze of lemon juice.",
    ],
    stepsAr: [
      "قلّبي البصل المقطّع شرائح في زيت الزيتون حتى يطرى.",
      "أضيفي الثوم المهروس واطهيه ٣٠ ثانية حتى تفوح الرائحة.",
      "أضيفي السبانخ على دفعات، وقلّبي حتى تذبل فقط.",
      "تبّلي وأضيفي عصير الليمون في النهاية.",
    ],
  },
  {
    id: "loubieh",
    name: "Green Beans in Olive Oil", nameAr: "لوبية بزيت الزيتون",
    tagline: "Classic Levantine green bean stew, loubieh bil zeit", taglineAr: "طبخة لوبية شامية كلاسيكية بزيت الزيتون",
    produce: ["Green Beans", "Tomato", "Yellow Onion", "Garlic"],
    pantry: ["Olive oil", "Salt & pepper"],
    pantryAr: ["زيت زيتون", "ملح وفلفل"],
    steps: [
      "Trim the green beans and cut into 2-inch pieces.",
      "Sauté diced onion and garlic in olive oil until soft.",
      "Add chopped tomato and cook until it breaks down into a light sauce.",
      "Add the green beans, cover, and simmer on low for 25–30 minutes until tender. Serve warm or at room temperature.",
    ],
    stepsAr: [
      "نظّفي الفاصولياء الخضراء وقطّعيها إلى قطع بطول ٥ سم.",
      "قلّبي البصل المقطّع والثوم في زيت الزيتون حتى يطريا.",
      "أضيفي الطماطم المفرومة واطهيها حتى تتحول إلى صلصة خفيفة.",
      "أضيفي الفاصولياء، غطّي، واتركيها على نار هادئة ٢٥-٣٠ دقيقة حتى تنضج. قدميها دافئة أو بدرجة حرارة الغرفة.",
    ],
  },
  {
    id: "roasted-beetroot",
    name: "Roasted Beetroot & Garlic", nameAr: "شمندر مشوي بالثوم",
    tagline: "Sweet, earthy roasted beets", taglineAr: "شمندر مشوي حلو المذاق بنكهة ترابية",
    produce: ["Beetroot", "Garlic", "Lemon", "Parsley"],
    pantry: ["Olive oil", "Salt & pepper"],
    pantryAr: ["زيت زيتون", "ملح وفلفل"],
    steps: [
      "Peel the beetroot and cut into wedges.",
      "Toss with olive oil, whole garlic cloves, salt and pepper.",
      "Roast at 200°C for 35–40 minutes until fork-tender.",
      "Finish with a squeeze of lemon and chopped parsley before serving.",
    ],
    stepsAr: [
      "قشّري الشمندر وقطّعيه إلى أرباع.",
      "اخلطيه مع زيت الزيتون وفصوص الثوم كاملة والملح والفلفل.",
      "اشويه على ٢٠٠ درجة مئوية لمدة ٣٥-٤٠ دقيقة حتى ينضج تمامًا.",
      "أضيفي عصير الليمون والبقدونس المفروم قبل التقديم.",
    ],
  },
  {
    id: "mushroom-saute",
    name: "Garlic Mushroom Sauté", nameAr: "فطر سوتيه بالثوم",
    tagline: "Quick, savory mushrooms in garlic butter", taglineAr: "فطر سريع بنكهة الثوم والزبدة",
    produce: ["Brown Mushroom", "Garlic", "Parsley", "Lemon"],
    pantry: ["Butter or olive oil", "Salt & pepper"],
    pantryAr: ["زبدة أو زيت زيتون", "ملح وفلفل"],
    steps: [
      "Slice the mushrooms thickly.",
      "Sauté in butter over high heat until golden brown, without stirring too often.",
      "Add crushed garlic in the last minute of cooking, so it doesn't burn.",
      "Finish with chopped parsley, a squeeze of lemon, salt and pepper.",
    ],
    stepsAr: [
      "قطّعي الفطر شرائح سميكة.",
      "قلّبيه في الزبدة على نار عالية حتى يصبح ذهبيًا، دون تحريك كثير.",
      "أضيفي الثوم المهروس في آخر دقيقة من الطهي حتى لا يحترق.",
      "أضيفي البقدونس المفروم وعصير الليمون والملح والفلفل في النهاية.",
    ],
  },
  {
    id: "sweet-potato-wedges",
    name: "Roasted Sweet Potato Wedges", nameAr: "بطاطا حلوة مشوية",
    tagline: "Crispy-edged herb-roasted wedges", taglineAr: "أصابع بطاطا حلوة مقرمشة بالأعشاب",
    produce: ["Sweet Potato", "Garlic"],
    pantry: ["Olive oil", "Rosemary or thyme", "Salt & pepper"],
    pantryAr: ["زيت زيتون", "إكليل الجبل أو الزعتر", "ملح وفلفل"],
    steps: [
      "Cut the sweet potatoes into thick wedges, skin on.",
      "Toss with olive oil, crushed garlic, rosemary, salt and pepper.",
      "Spread in a single layer on a tray and roast at 220°C for 25–30 minutes, turning halfway.",
      "Serve hot as a side dish.",
    ],
    stepsAr: [
      "قطّعي البطاطا الحلوة إلى أصابع سميكة مع القشرة.",
      "اخلطيها مع زيت الزيتون والثوم المهروس وإكليل الجبل والملح والفلفل.",
      "افرديها طبقة واحدة على صينية واشويها على ٢٢٠ درجة مئوية لمدة ٢٥-٣٠ دقيقة مع التقليب في المنتصف.",
      "قدميها ساخنة كطبق جانبي.",
    ],
  },
  {
    id: "garlic-broccoli",
    name: "Garlic Roasted Broccoli", nameAr: "بروكلي مشوي بالثوم",
    tagline: "Simple, fast, crispy-edged broccoli", taglineAr: "بروكلي سريع ومقرمش بنكهة الثوم",
    produce: ["Broccoli", "Garlic", "Lemon"],
    pantry: ["Olive oil", "Salt & pepper", "Chili flakes (optional)"],
    pantryAr: ["زيت زيتون", "ملح وفلفل", "رقائق فلفل حار (اختياري)"],
    steps: [
      "Cut the broccoli into florets.",
      "Toss with olive oil, thinly sliced garlic, salt and pepper.",
      "Roast at 220°C for 15–18 minutes until the edges char slightly.",
      "Finish with a squeeze of lemon just before serving.",
    ],
    stepsAr: [
      "قطّعي البروكلي إلى زهيرات.",
      "اخلطيه مع زيت الزيتون والثوم المقطّع رقائق رفيعة والملح والفلفل.",
      "اشويه على ٢٢٠ درجة مئوية لمدة ١٥-١٨ دقيقة حتى تتحمّص الأطراف قليلًا.",
      "أضيفي عصير الليمون مباشرة قبل التقديم.",
    ],
  },
  {
    id: "tropical-fruit-salad",
    name: "Tropical Fruit Salad", nameAr: "سلطة فواكه استوائية",
    tagline: "Mango, pineapple, dragon fruit & pomegranate", taglineAr: "مانجو وأناناس وفاكهة التنين والرمان",
    produce: ["Mango", "Pineapple", "Dragon Fruit", "Pomegranate"],
    pantry: ["Fresh mint leaves", "Lime juice", "Honey (optional)"],
    pantryAr: ["أوراق نعناع طازجة", "عصير ليمون أخضر", "عسل (اختياري)"],
    steps: [
      "Peel and cube the mango, pineapple and dragon fruit.",
      "Combine in a bowl with the pomegranate seeds.",
      "Squeeze over fresh lime juice and toss gently.",
      "Scatter torn mint leaves on top and drizzle with honey if you like it sweeter.",
    ],
    stepsAr: [
      "قشّري المانجو والأناناس وفاكهة التنين وقطّعيها مكعبات.",
      "اخلطيها في وعاء مع حبوب الرمان.",
      "اعصري الليمون الأخضر فوقها وقلّبي برفق.",
      "انثري أوراق النعناع الممزقة فوقها ورشّي القليل من العسل إن أردتِ نكهة أحلى.",
    ],
  },
  {
    id: "blueberry-banana-smoothie",
    name: "Blueberry & Banana Smoothie", nameAr: "سموذي التوت الأزرق والموز",
    tagline: "Thick, cold, and packed with berries", taglineAr: "سموذي بارد وسميك مليء بالتوت",
    produce: ["Blueberries", "Banana", "Strawberry"],
    pantry: ["Milk or yogurt", "Honey (optional)", "Ice cubes"],
    pantryAr: ["حليب أو زبادي", "عسل (اختياري)", "مكعبات ثلج"],
    steps: [
      "Add the blueberries, banana and strawberries to a blender.",
      "Pour in milk or yogurt and a handful of ice.",
      "Blend until smooth and thick, adding honey to taste.",
      "Pour into a glass and serve immediately.",
    ],
    stepsAr: [
      "ضعي التوت الأزرق والموز والفراولة في الخلاط.",
      "أضيفي الحليب أو الزبادي وحفنة من الثلج.",
      "اخلطي حتى يصبح القوام ناعمًا وسميكًا، وأضيفي العسل حسب الرغبة.",
      "اسكبيه في كوب وقدّميه فورًا.",
    ],
  },
  {
    id: "honey-peach-grape-platter",
    name: "Honey Peach & Grape Platter", nameAr: "طبق خوخ عسلي وعنب",
    tagline: "An easy no-cook fruit board", taglineAr: "طبق فواكه سهل بلا طهي",
    produce: ["Honey Peach", "Grapes (Red)", "Grapes (Green)", "Apple"],
    pantry: ["A soft cheese, to serve (optional)", "A handful of nuts (optional)"],
    pantryAr: ["جبنة طرية للتقديم (اختياري)", "حفنة مكسرات (اختياري)"],
    steps: [
      "Slice the honey peaches and apple into wedges.",
      "Arrange on a board with the red and green grape bunches.",
      "Add a soft cheese and a handful of nuts alongside, if using.",
      "Serve at room temperature so the fruit's full sweetness comes through.",
    ],
    stepsAr: [
      "قطّعي الخوخ العسلي والتفاح إلى أنصاف أو أرباع.",
      "رتّبيها على طبق مع عناقيد العنب الأحمر والأخضر.",
      "أضيفي جبنة طرية وحفنة مكسرات بجانبها إن أردتِ.",
      "قدّميها بحرارة الغرفة ليظهر طعم الفاكهة الحلو بالكامل.",
    ],
  },
  {
    id: "pomegranate-mandarin-salad",
    name: "Pomegranate & Mandarin Salad", nameAr: "سلطة رمان ويوسفي",
    tagline: "A bright, jewel-toned winter salad", taglineAr: "سلطة شتوية زاهية بألوان الجواهر",
    produce: ["Pomegranate", "Mandarin", "Mint"],
    pantry: ["Olive oil", "A pinch of salt", "Toasted nuts (optional)"],
    pantryAr: ["زيت زيتون", "رشة ملح", "مكسرات محمصة (اختياري)"],
    steps: [
      "Peel the mandarins and separate into segments, removing any pith.",
      "Scatter over a plate with the pomegranate seeds.",
      "Tear over fresh mint leaves and drizzle with olive oil and a pinch of salt.",
      "Top with toasted nuts for crunch, if you like.",
    ],
    stepsAr: [
      "قشّري اليوسفي وافصليه إلى فصوص، مع إزالة أي قشور بيضاء.",
      "وزّعيه على طبق مع حبوب الرمان.",
      "أضيفي أوراق النعناع الممزقة ورشّة زيت زيتون وملح.",
      "أضيفي مكسرات محمصة فوقها للحصول على قرمشة إن أردتِ.",
    ],
  },
  {
    id: "strawberry-mint-lemonade",
    name: "Strawberry Mint Lemonade", nameAr: "ليموناضة الفراولة والنعناع",
    tagline: "Cold, sweet-tart, and endlessly refreshing", taglineAr: "مشروب بارد ومنعش بطعم حلو حامض",
    produce: ["Strawberry", "Lemon", "Mint"],
    pantry: ["Sugar or honey", "Cold water", "Ice"],
    pantryAr: ["سكر أو عسل", "ماء بارد", "ثلج"],
    steps: [
      "Blend the strawberries with a little water until smooth, then strain if you prefer it clear.",
      "Squeeze the lemons and mix the juice with the strawberry purée.",
      "Add sugar or honey to taste, then top up with cold water.",
      "Serve over ice with a few mint leaves.",
    ],
    stepsAr: [
      "اخلطي الفراولة مع القليل من الماء حتى يصبح القوام ناعمًا، وصفّيها إن أردتِها صافية.",
      "اعصري الليمون واخلطي عصيره مع هريس الفراولة.",
      "أضيفي السكر أو العسل حسب الرغبة، ثم أضيفي الماء البارد.",
      "قدّميها مع الثلج وبضع أوراق نعناع.",
    ],
  },
  {
    id: "bamia-okra-stew",
    name: "Bamia (Okra & Tomato Stew)", nameAr: "بامية باللحم أو نباتية",
    tagline: "Classic Middle Eastern okra stew", taglineAr: "طبخة البامية الشرق أوسطية الكلاسيكية",
    produce: ["Okra", "Tomato", "Garlic", "Yellow Onion", "Coriander (Cilantro)"],
    pantry: ["Tomato paste", "Vegetable or meat stock", "Ghee or oil", "Rice, to serve"],
    pantryAr: ["معجون طماطم", "مرق خضار أو لحم", "سمن أو زيت", "أرز للتقديم"],
    steps: [
      "Trim the okra and sauté briefly in ghee until lightly golden, then set aside.",
      "In the same pot, soften chopped onion and garlic, then stir in tomato paste.",
      "Add chopped tomato, coriander and stock, and simmer for 10 minutes.",
      "Return the okra to the pot and simmer gently for another 15–20 minutes until tender. Serve over rice.",
    ],
    stepsAr: [
      "نظّفي البامية وحمّريها قليلًا في السمن حتى يصفرّ لونها قليلًا، ثم ضعيها جانبًا.",
      "في نفس القدر، حمّري البصل والثوم المفروم، ثم أضيفي معجون الطماطم.",
      "أضيفي الطماطم المفرومة والكزبرة والمرق، واتركيها على نار هادئة ١٠ دقائق.",
      "أعيدي البامية إلى القدر واتركيها على نار هادئة ١٥-٢٠ دقيقة أخرى حتى تنضج. قدّميها مع الأرز.",
    ],
  },
  {
    id: "roasted-pumpkin-soup",
    name: "Roasted Pumpkin Soup", nameAr: "شوربة اليقطين المشوي",
    tagline: "Warm, creamy, and naturally sweet", taglineAr: "شوربة دافئة وكريمية وحلوة بشكل طبيعي",
    produce: ["Pumpkin", "Yellow Onion", "Garlic", "Thyme"],
    pantry: ["Vegetable stock", "Olive oil", "Cream (optional)", "Salt & pepper"],
    pantryAr: ["مرق خضار", "زيت زيتون", "كريمة (اختياري)", "ملح وفلفل"],
    steps: [
      "Peel and cube the pumpkin, then roast with olive oil at 200°C for 25 minutes until soft.",
      "Sauté chopped onion and garlic until translucent.",
      "Add the roasted pumpkin, thyme and stock, and simmer for 10 minutes.",
      "Blend until smooth, stir in a splash of cream if using, and season to taste.",
    ],
    stepsAr: [
      "قشّري اليقطين وقطّعيه مكعبات، ثم اشويه مع زيت الزيتون على ٢٠٠ درجة مئوية لمدة ٢٥ دقيقة حتى يلين.",
      "حمّري البصل والثوم المفروم حتى يصبح شفافًا.",
      "أضيفي اليقطين المشوي والزعتر والمرق، واتركيها على نار هادئة ١٠ دقائق.",
      "اخلطيها حتى يصبح القوام ناعمًا، وأضيفي القليل من الكريمة إن أردتِ، وتبّليها حسب الرغبة.",
    ],
  },
  {
    id: "roasted-baby-potatoes",
    name: "Garlic Herb Baby Potatoes", nameAr: "بطاطا صغيرة بالثوم والأعشاب",
    tagline: "Crispy outside, soft in the middle", taglineAr: "مقرمشة من الخارج وطرية من الداخل",
    produce: ["Baby Potato", "Garlic", "Rosemary"],
    pantry: ["Olive oil", "Salt & pepper"],
    pantryAr: ["زيت زيتون", "ملح وفلفل"],
    steps: [
      "Boil the baby potatoes whole for 10 minutes, then drain well.",
      "Toss with olive oil, crushed garlic, rosemary, salt and pepper.",
      "Spread on a tray and roast at 220°C for 20–25 minutes until golden and crisp.",
      "Serve hot as a side dish.",
    ],
    stepsAr: [
      "اسلقي البطاطا الصغيرة كاملة لمدة ١٠ دقائق، ثم صفّيها جيدًا.",
      "اخلطيها مع زيت الزيتون والثوم المهروس وإكليل الجبل والملح والفلفل.",
      "افرديها على صينية واشويها على ٢٢٠ درجة مئوية لمدة ٢٠-٢٥ دقيقة حتى تصبح ذهبية ومقرمشة.",
      "قدّميها ساخنة كطبق جانبي.",
    ],
  },
  {
    id: "pickled-turnip",
    name: "Pickled Turnip (Kabees el Lift)", nameAr: "كبيس اللفت",
    tagline: "The pink pickle on every mezze table", taglineAr: "المخلل الوردي الذي لا يغيب عن مائدة المقبلات",
    produce: ["Turnip", "Beetroot", "Garlic"],
    pantry: ["White vinegar", "Water", "Salt"],
    pantryAr: ["خل أبيض", "ماء", "ملح"],
    steps: [
      "Peel and cut the turnips into sticks or wedges.",
      "Pack into a clean jar with a few slices of beetroot (for color) and a garlic clove.",
      "Make a brine of equal parts vinegar and water with a generous spoon of salt, and pour over to cover.",
      "Seal and leave at room temperature for 3–5 days before refrigerating.",
    ],
    stepsAr: [
      "قشّري اللفت وقطّعيه أصابع أو أرباع.",
      "رصّيه في برطمان نظيف مع بضع شرائح شمندر (لإعطاء اللون) وفص ثوم.",
      "حضّري محلول ملحي من كميات متساوية من الخل والماء مع ملعقة سخية من الملح، واسكبيه ليغطي اللفت.",
      "أغلقي البرطمان واتركيه بحرارة الغرفة لمدة ٣-٥ أيام قبل تبريده.",
    ],
  },
  {
    id: "kousa-mahshi",
    name: "Kousa Mahshi (Stuffed Zucchini)", nameAr: "كوسا محشية",
    tagline: "Rice-stuffed zucchini in tomato sauce", taglineAr: "كوسا محشوة بالأرز في صلصة الطماطم",
    produce: ["Kousa (Light Green Zucchini)", "Tomato", "Yellow Onion", "Garlic"],
    pantry: ["Short-grain rice", "Ground meat (optional)", "Seven spice", "Tomato paste"],
    pantryAr: ["أرز قصير الحبة", "لحم مفروم (اختياري)", "بهار سبعة", "معجون طماطم"],
    steps: [
      "Hollow out the kousa with a corer, keeping the shell intact.",
      "Mix rice (and meat, if using) with grated onion, garlic, and seven spice, and stuff the kousa loosely.",
      "Layer in a pot with sliced tomato and tomato paste dissolved in water.",
      "Simmer covered for 40–45 minutes until the rice is fully cooked and the kousa is tender.",
    ],
    stepsAr: [
      "فرّغي الكوسا بواسطة منقّر مع الحفاظ على القشرة سليمة.",
      "اخلطي الأرز (واللحم إن أردتِ) مع البصل المبشور والثوم والبهار السبعة، واحشي الكوسا برفق دون ضغط.",
      "رصّيها في قدر مع شرائح الطماطم ومعجون الطماطم المذاب في الماء.",
      "اتركيها على نار هادئة ومغطاة لمدة ٤٠-٤٥ دقيقة حتى ينضج الأرز وتلين الكوسا.",
    ],
  },
  {
    id: "batata-harra",
    name: "Batata Harra (Spicy Potatoes)", nameAr: "بطاطا حرة",
    tagline: "Crispy potatoes with garlic, chili & coriander", taglineAr: "بطاطا مقرمشة بالثوم والفلفل الحار والكزبرة",
    produce: ["Baby Potato", "Garlic", "Coriander (Cilantro)", "Green Chili"],
    pantry: ["Olive oil", "Lemon juice", "Salt"],
    pantryAr: ["زيت زيتون", "عصير ليمون", "ملح"],
    steps: [
      "Cube the potatoes and fry or roast until deeply golden and crisp.",
      "Finely chop the garlic, green chili, and coriander.",
      "Toss the hot potatoes with the garlic-chili-coriander mix and a good glug of olive oil.",
      "Finish with fresh lemon juice and salt, and serve immediately while hot.",
    ],
    stepsAr: [
      "قطّعي البطاطا مكعبات وحمّريها أو اشويها حتى تصبح ذهبية ومقرمشة.",
      "افرمي الثوم والفلفل الأخضر الحار والكزبرة ناعمًا.",
      "قلّبي البطاطا الساخنة مع خليط الثوم والفلفل والكزبرة وكمية سخية من زيت الزيتون.",
      "أضيفي عصير الليمون الطازج والملح وقدّميها فورًا وهي ساخنة.",
    ],
  },
  {
    id: "zaatar-manouche",
    name: "Za'atar Man'ouche", nameAr: "منقوشة زعتر",
    tagline: "The classic breakfast flatbread", taglineAr: "خبز الفطور الكلاسيكي",
    produce: ["Tomato", "Mint"],
    pantry: ["Flatbread or man'ouche dough", "Za'atar Trio Box", "Premium Extra Virgin Olive Oil"],
    pantryAr: ["عجينة خبز أو منقوشة", "علبة الزعتر الثلاثية", "زيت زيتون بكر ممتاز فاخر"],
    steps: [
      "Mix a generous spoon of za'atar (try the Classic or Spicy blend) with olive oil to make a spreadable paste.",
      "Spread evenly over rolled-out dough, all the way to the edges.",
      "Bake in a hot oven (or on a flat pan) until the edges are golden and crisp, about 8–10 minutes.",
      "Serve warm with sliced tomato and fresh mint on the side.",
    ],
    stepsAr: [
      "اخلطي ملعقة سخية من الزعتر (جرّبي الخلطة الكلاسيكية أو الحارة) مع زيت الزيتون لتحصلي على عجينة قابلة للدهن.",
      "افردي الخليط بالتساوي على العجينة المفرودة، حتى الأطراف.",
      "اخبزيها في فرن ساخن (أو على صاج مسطح) حتى تصبح الأطراف ذهبية ومقرمشة، لمدة ٨-١٠ دقائق تقريبًا.",
      "قدّميها دافئة مع شرائح الطماطم والنعناع الطازج.",
    ],
  },
  {
    id: "maqluba",
    name: "Maqluba (Upside-Down Rice)", nameAr: "مقلوبة",
    tagline: "Layered rice, eggplant & cauliflower, flipped tableside", taglineAr: "أرز مطبق مع الباذنجان والقرنبيط، يُقلب على المائدة",
    produce: ["Eggplant", "Cauliflower", "Carrot", "Yellow Onion"],
    pantry: ["Rice", "Chicken or vegetable stock", "Seven spice", "Frying oil"],
    pantryAr: ["أرز", "مرق دجاج أو خضار", "بهار سبعة", "زيت للقلي"],
    steps: [
      "Fry sliced eggplant and cauliflower florets until golden, and set aside.",
      "Layer the fried vegetables, sliced carrot, and onion in a large pot.",
      "Top with rice and season with seven spice, then pour over hot stock to just cover.",
      "Simmer covered until the rice is cooked, then carefully invert the whole pot onto a large serving platter.",
    ],
    stepsAr: [
      "حمّري شرائح الباذنجان وزهيرات القرنبيط حتى تصبح ذهبية، وضعيها جانبًا.",
      "رصّي الخضار المحمّرة مع شرائح الجزر والبصل في قدر كبير.",
      "أضيفي الأرز فوقها وتبّليه بالبهار السبعة، ثم اسكبي المرق الساخن ليغطيها بالكاد.",
      "اتركيها على نار هادئة ومغطاة حتى ينضج الأرز، ثم اقلبي القدر بعناية على طبق تقديم كبير.",
    ],
  },
  {
    id: "fattet-hummus",
    name: "Fattet Hummus", nameAr: "فتة حمص",
    tagline: "Layered chickpeas, yogurt & crisp bread", taglineAr: "طبقات من الحمص واللبن والخبز المقرمش",
    produce: ["Garlic", "Mint"],
    pantry: ["Cooked chickpeas", "Yogurt", "Pita bread", "Pine nuts", "Butter or ghee"],
    pantryAr: ["حمص مسلوق", "لبن زبادي", "خبز عربي", "صنوبر", "زبدة أو سمن"],
    steps: [
      "Toast torn pita in butter until golden and crisp, and layer in the base of a serving dish.",
      "Warm the chickpeas through in a little of their cooking liquid.",
      "Mix yogurt with crushed garlic and a pinch of salt, and spoon generously over the bread and chickpeas.",
      "Top with toasted pine nuts and a scattering of fresh mint, and serve immediately so the bread stays crisp.",
    ],
    stepsAr: [
      "حمّري الخبز العربي الممزق في الزبدة حتى يصبح ذهبيًا ومقرمشًا، ورصّيه في قاع طبق التقديم.",
      "سخّني الحمص قليلًا في جزء من ماء سلقه.",
      "اخلطي اللبن مع الثوم المهروس ورشة ملح، واسكبيه بسخاء فوق الخبز والحمص.",
      "أضيفي الصنوبر المحمّص ورشّي النعناع الطازج، وقدّميها فورًا ليبقى الخبز مقرمشًا.",
    ],
  },
  {
    id: "honey-roasted-roots",
    name: "Honey Roasted Root Vegetables", nameAr: "خضروات جذرية مشوية بالعسل",
    tagline: "Beetroot, turnip & parsnip, glazed and caramelized", taglineAr: "شمندر ولفت وجزر أبيض مغطاة بالعسل ومكرملة",
    produce: ["Beetroot", "Turnip", "Parsnip"],
    pantry: ["Honey Jar", "Premium Extra Virgin Olive Oil", "Fresh thyme (optional)", "Salt & pepper"],
    pantryAr: ["برطمان عسل", "زيت زيتون بكر ممتاز فاخر", "زعتر طازج (اختياري)", "ملح وفلفل"],
    steps: [
      "Peel and cut the beetroot, turnip, and parsnip into even wedges.",
      "Toss with olive oil, salt, and pepper, and roast at 210°C for 30 minutes.",
      "Drizzle generously with honey and toss again, then return to the oven for a final 10 minutes until caramelized.",
      "Scatter with fresh thyme, if using, and serve warm.",
    ],
    stepsAr: [
      "قشّري الشمندر واللفت والجزر الأبيض وقطّعيها أرباعًا متساوية.",
      "اخلطيها مع زيت الزيتون والملح والفلفل، واشويها على ٢١٠ درجة مئوية لمدة ٣٠ دقيقة.",
      "أضيفي العسل بسخاء وقلّبيها مجددًا، ثم أعيديها للفرن ١٠ دقائق أخيرة حتى تتكرمل.",
      "انثري الزعتر الطازج إن أردتِ، وقدّميها دافئة.",
    ],
  },
  {
    id: "spiced-carrot-chickpea-bowl",
    name: "Spiced Carrot & Chickpea Bowl", nameAr: "طبق الجزر والحمص المتبّل",
    tagline: "A warm, filling bowl with bold spice", taglineAr: "طبق دافئ ومُشبع بنكهة قوية",
    produce: ["Carrot", "Garlic", "Coriander (Cilantro)"],
    pantry: ["Cooked chickpeas", "Ground cumin", "Yogurt", "Artisanal Spice Collection"],
    pantryAr: ["حمص مسلوق", "كمون مطحون", "لبن زبادي", "مجموعة توابل حرفية"],
    steps: [
      "Roast sliced carrots with olive oil, cumin, and a pinch of Aleppo pepper (from your Spice Collection) until tender.",
      "Warm the chickpeas with crushed garlic in a little olive oil.",
      "Spoon yogurt into the base of a bowl, then layer the roasted carrots and warm chickpeas on top.",
      "Finish with chopped coriander and an extra pinch of sumac for brightness.",
    ],
    stepsAr: [
      "اشوي شرائح الجزر مع زيت الزيتون والكمون ورشة من الفلفل الحلبي (من مجموعة التوابل) حتى تلين.",
      "سخّني الحمص مع الثوم المهروس في القليل من زيت الزيتون.",
      "ضعي اللبن في قاع الطبق، ثم رصّي الجزر المشوي والحمص الدافئ فوقه.",
      "أضيفي الكزبرة المفرومة ورشة إضافية من السماق لإضافة نكهة منعشة.",
    ],
  },
  {
    id: "creamy-pumpkin-risotto",
    name: "Creamy Pumpkin Risotto", nameAr: "ريزوتو اليقطين الكريمي",
    tagline: "Comforting, golden, and slow-stirred", taglineAr: "طبق دافئ وذهبي يُحضّر بالتقليب البطيء",
    produce: ["Pumpkin", "Yellow Onion", "Garlic"],
    pantry: ["Arborio rice", "Vegetable stock", "Parmesan (optional)", "Butter"],
    pantryAr: ["أرز أربوريو", "مرق خضار", "جبنة بارميزان (اختياري)", "زبدة"],
    steps: ["Roast the pumpkin until soft, then mash roughly.",
      "Sauté chopped onion and garlic in butter until soft, then stir in the rice for a minute.",
      "Add warm stock a ladle at a time, stirring often, until the rice is creamy and just tender.",
      "Fold in the roasted pumpkin and a knob of butter (and parmesan, if using) just before serving.",
    ],
    stepsAr: [
      "اشوي اليقطين حتى يلين، ثم اهرسيه هرسًا خشنًا.",
      "قلّبي البصل والثوم المفروم في الزبدة حتى يلينا، ثم أضيفي الأرز وقلّبيه لدقيقة.",
      "أضيفي المرق الساخن مغرفة تلو الأخرى مع التقليب المستمر حتى يصبح الأرز كريميًا ونيّئًا بالكاد.",
      "أضيفي اليقطين المهروس وقطعة زبدة (وجبنة البارميزان إن أردتِ) قبل التقديم مباشرة.",
    ],
  },
  {
    id: "herb-oil-dip-board",
    name: "Herb & Olive Oil Dip Board", nameAr: "طبق غموس الأعشاب وزيت الزيتون",
    tagline: "A simple, elegant starter for any table", taglineAr: "مقبّلات بسيطة وأنيقة لأي مائدة",
    produce: ["Fresh Garlic", "Chili Pepper"],
    pantry: ["Premium Extra Virgin Olive Oil", "Artisanal Spice Collection", "Warm bread"],
    pantryAr: ["زيت زيتون بكر ممتاز فاخر", "مجموعة توابل حرفية", "خبز دافئ"],
    steps: [
      "Pour a generous layer of olive oil into a shallow dish.",
      "Sprinkle over a spoonful of za'atar or sumac from your Spice Collection, and finely chopped garlic and chili.",
      "Let it sit for 10 minutes so the flavors bloom into the oil.",
      "Serve with warm bread for dipping.",
    ],
    stepsAr: [
      "اسكبي طبقة سخية من زيت الزيتون في طبق ضحل.",
      "رشّي ملعقة من الزعتر أو السماق من مجموعة التوابل، مع الثوم والفلفل الحار المفروم ناعمًا.",
      "اتركيه ١٠ دقائق ليتشرّب الزيت بالنكهات.",
      "قدّميه مع الخبز الدافئ للتغميس.",
    ],
  },
  {
    id: "freekeh-vegetable-pilaf",
    name: "Freekeh & Vegetable Pilaf", nameAr: "فريكة بالخضار",
    tagline: "Smoky roasted green wheat with vegetables", taglineAr: "قمح أخضر مشوي مع الخضار",
    produce: ["Carrot", "Yellow Onion", "Green Almonds (Seasonal)"],
    pantry: ["Freekeh", "Vegetable or chicken stock", "Ghee or butter", "Cinnamon stick"],
    pantryAr: ["فريكة", "مرق خضار أو دجاج", "سمن أو زبدة", "عود قرفة"],
    steps: [
      "Rinse the freekeh well and set aside.",
      "Sauté chopped onion and carrot in ghee until softened, with a cinnamon stick for warmth.",
      "Add the freekeh and toast briefly, then pour in stock and simmer covered for 20–25 minutes until tender.",
      "Fold through chopped green almonds just before serving for a fresh, seasonal crunch.",
    ],
    stepsAr: [
      "اغسلي الفريكة جيدًا وضعيها جانبًا.",
      "قلّبي البصل والجزر المفروم في السمن حتى يلينا، مع عود قرفة لإضافة الدفء.",
      "أضيفي الفريكة وحمّصيها قليلًا، ثم اسكبي المرق واتركيها على نار هادئة ومغطاة ٢٠-٢٥ دقيقة حتى تنضج.",
      "أضيفي اللوز الأخضر المفروم قبل التقديم مباشرة لإضافة قرمشة موسمية طازجة.",
    ],
  },
  {
    id: "cherry-almond-salad",
    name: "Cherry & Almond Salad", nameAr: "سلطة الكرز واللوز",
    tagline: "Sweet, crisp, and a little bit fancy", taglineAr: "حلوة ومقرمشة وأنيقة قليلًا",
    produce: ["Cherry", "Rocket (Arugula)", "Lemon"],
    pantry: ["Toasted almonds", "Soft cheese (feta or goat)", "Olive oil", "Honey"],
    pantryAr: ["لوز محمّص", "جبنة طرية (فيتا أو جبنة ماعز)", "زيت زيتون", "عسل"],
    steps: [
      "Pit and halve the cherries.",
      "Toss the arugula with olive oil, lemon juice, and a drizzle of honey.",
      "Scatter over the cherries, toasted almonds, and crumbled cheese.",
      "Serve immediately while the greens are still crisp.",
    ],
    stepsAr: [
      "انزعي نوى الكرز وقطّعيه أنصافًا.",
      "قلّبي الجرجير مع زيت الزيتون وعصير الليمون وقليل من العسل.",
      "انثري الكرز واللوز المحمّص والجبنة المفرومة فوق السلطة.",
      "قدّميها فورًا بينما الخضار لا تزال مقرمشة.",
    ],
  },
  {
    id: "peach-berry-bowl",
    name: "Flat Peach & Berry Bowl", nameAr: "طبق الخوخ المفلطح والتوت",
    tagline: "A bright summer breakfast or dessert", taglineAr: "فطور أو حلى صيفي منعش",
    produce: ["Flat Peach", "Blackberry", "Raspberry", "Mint"],
    pantry: ["Greek yogurt", "Honey", "Granola (optional)"],
    pantryAr: ["لبن يوناني", "عسل", "غرانولا (اختياري)"],
    steps: [
      "Slice the flat peaches into wedges.",
      "Spoon yogurt into a bowl and arrange the peach wedges, blackberries, and raspberries on top.",
      "Drizzle generously with honey and scatter fresh mint leaves over everything.",
      "Add a handful of granola for crunch, if using, and serve right away.",
    ],
    stepsAr: [
      "قطّعي الخوخ المفلطح إلى أرباع.",
      "ضعي اللبن في طبق ورتّبي شرائح الخوخ والتوت الأسود وتوت العليق فوقه.",
      "أضيفي العسل بسخاء وانثري أوراق النعناع الطازجة فوق الطبق.",
      "أضيفي حفنة من الغرانولا للقرمشة إن أردتِ، وقدّميه فورًا.",
    ],
  },
  {
    id: "apricot-honey-breakfast",
    name: "Apricot & Honey Breakfast Bowl", nameAr: "طبق فطور المشمش والعسل",
    tagline: "A simple, golden way to start the day", taglineAr: "بداية ذهبية وبسيطة للنهار",
    produce: ["Apricot"],
    pantry: ["Honey Jar", "Oats or labneh", "Toasted walnuts"],
    pantryAr: ["برطمان عسل", "شوفان أو لبنة", "جوز محمّص"],
    steps: [
      "Halve and pit the apricots.",
      "Spoon oats or labneh into a bowl as the base.",
      "Arrange the apricot halves on top and drizzle with honey from the jar.",
      "Finish with a scatter of toasted walnuts.",
    ],
    stepsAr: [
      "قطّعي المشمش أنصافًا وانزعي النوى.",
      "ضعي الشوفان أو اللبنة في طبق كقاعدة.",
      "رتّبي أنصاف المشمش فوقها واسكبي العسل من البرطمان.",
      "أضيفي الجوز المحمّص فوق الطبق للتقديم.",
    ],
  },
  {
    id: "mixed-berry-compote",
    name: "Mixed Berry Compote", nameAr: "كومبوت التوت المشكّل",
    tagline: "A warm sauce for pancakes, yogurt, or ice cream", taglineAr: "صوص دافئ للبان كيك أو اللبن أو الآيس كريم",
    produce: ["Blackberry", "Raspberry", "Lemon"],
    pantry: ["Sugar", "Cornstarch (optional, for thickening)"],
    pantryAr: ["سكر", "نشا الذرة (اختياري للتكثيف)"],
    steps: [
      "Combine the blackberries and raspberries in a small pot with a splash of water and sugar to taste.",
      "Simmer gently for 8–10 minutes, stirring occasionally, until the berries break down.",
      "Add a squeeze of lemon juice and, if a thicker sauce is wanted, a little cornstarch mixed with water.",
      "Cool slightly before spooning over pancakes, yogurt, or ice cream.",
    ],
    stepsAr: [
      "ضعي التوت الأسود وتوت العليق في قدر صغير مع قليل من الماء والسكر حسب الرغبة.",
      "اتركيها على نار هادئة ٨-١٠ دقائق مع التحريك من وقت لآخر حتى يتفكك التوت.",
      "أضيفي عصير الليمون، وإذا رغبتِ بصوص أكثر كثافة أضيفي قليلًا من نشا الذرة المذاب بالماء.",
      "اتركيها تبرد قليلًا قبل تقديمها فوق البان كيك أو اللبن أو الآيس كريم.",
    ],
  },
  {
    id: "fried-kibbeh-platter",
    name: "Fried Kibbeh Platter", nameAr: "طبق الكبة المقلية",
    tagline: "Ready-to-fry, served the classic way", taglineAr: "جاهزة للقلي، تُقدّم بالطريقة التقليدية",
    produce: ["Lemon", "Fresh Garlic"],
    pantry: ["Kibbeh", "Frying oil", "Plain yogurt", "Tahini"],
    pantryAr: ["كبة", "زيت للقلي", "لبن زبادي", "طحينة"],
    steps: [
      "Fry the frozen kibbeh directly from frozen in hot oil until deep golden, about 5–6 minutes.",
      "Drain well on paper towels.",
      "Mix yogurt with a little tahini, crushed garlic, and a squeeze of lemon for a quick dipping sauce.",
      "Serve the kibbeh hot, with lemon wedges and the yogurt-tahini sauce alongside.",
    ],
    stepsAr: [
      "حمّري الكبة المجمدة مباشرة في زيت حار حتى تصبح ذهبية غامقة، لمدة ٥-٦ دقائق تقريبًا.",
      "صفّيها جيدًا على ورق مطبخ.",
      "اخلطي اللبن مع قليل من الطحينة والثوم المهروس وعصير الليمون لتحضير صوص تغميس سريع.",
      "قدّمي الكبة ساخنة مع قطع الليمون وصوص اللبن والطحينة.",
    ],
  },
  {
    id: "sambousek-party-platter",
    name: "Sambousek Party Platter", nameAr: "طبق السمبوسك للضيافة",
    tagline: "Meat and cheese sambousek, fried and ready to share", taglineAr: "سمبوسك لحمة وجبنة، مقلي وجاهز للمشاركة",
    produce: ["Mint", "Lemon"],
    pantry: ["Meat Sambousek", "Cheese Sambousek", "Frying oil", "Zaatar Trio Box (for dusting)"],
    pantryAr: ["سمبوسة لحمة", "سمبوسة جبنة", "زيت للقلي", "علبة الزعتر الثلاثية (للتزيين)"],
    steps: [
      "Fry the meat and cheese sambousek separately, directly from frozen, until golden and crisp.",
      "Drain on paper towels and arrange together on a large platter.",
      "Dust lightly with za'atar from the Trio Box for extra flavor and color.",
      "Garnish with fresh mint and lemon wedges, and serve warm.",
    ],
    stepsAr: [
      "حمّري سمبوسك اللحمة والجبنة كلًا على حدة، مباشرة من التجميد، حتى تصبح ذهبية ومقرمشة.",
      "صفّيها على ورق مطبخ ورتّبيها معًا في طبق تقديم كبير.",
      "رشّي قليلًا من الزعتر من العلبة الثلاثية لإضافة نكهة ولون.",
      "زيّنيها بالنعناع الطازج وقطع الليمون وقدّميها دافئة.",
    ],
  },
  {
    id: "cherry-blackberry-lemonade",
    name: "Cherry & Blackberry Lemonade", nameAr: "ليموناضة الكرز والتوت الأسود",
    tagline: "A deep-red, fruity twist on classic lemonade", taglineAr: "ليموناضة بلمسة فاكهية حمراء غامقة",
    produce: ["Cherry", "Blackberry", "Lemon", "Mint"],
    pantry: ["Sugar or honey", "Cold water", "Ice"],
    pantryAr: ["سكر أو عسل", "ماء بارد", "ثلج"],
    steps: [
      "Pit the cherries and muddle them with the blackberries in a jug.",
      "Add fresh lemon juice, sugar or honey to taste, and cold water.",
      "Stir well and strain if a smoother drink is preferred.",
      "Serve over ice with a sprig of mint.",
    ],
    stepsAr: [
      "انزعي نوى الكرز واهرسيه مع التوت الأسود في إبريق.",
      "أضيفي عصير الليمون الطازج والسكر أو العسل حسب الرغبة والماء البارد.",
      "قلّبي جيدًا وصفّيها إذا رغبتِ بمشروب أكثر نقاءً.",
      "قدّميها مع الثلج وغصن من النعناع.",
    ],
  },
  {
    id: "kale-cabbage-slaw",
    name: "Kale & White Cabbage Slaw", nameAr: "سلطة الكرنب واللفت الأبيض",
    tagline: "Crunchy, bright, and packed with greens", taglineAr: "مقرمشة ومنعشة وغنية بالخضار",
    produce: ["Kale", "White Cabbage", "Carrot", "Lemon"],
    pantry: ["Olive oil", "Dijon mustard (optional)", "Salt"],
    pantryAr: ["زيت زيتون", "خردل ديجون (اختياري)", "ملح"],
    steps: [
      "Finely shred the kale and white cabbage, and grate the carrot.",
      "Whisk together olive oil, lemon juice, mustard, and a pinch of salt for the dressing.",
      "Toss everything together and massage briefly with your hands — this softens the kale nicely.",
      "Let it sit for 10 minutes before serving so the flavors settle in.",
    ],
    stepsAr: [
      "قطّعي الكرنب واللفت الأبيض شرائح رفيعة جدًا، وابشري الجزر.",
      "اخفقي زيت الزيتون وعصير الليمون والخردل ورشة ملح لتحضير التتبيلة.",
      "قلّبي كل المكونات معًا وافركيها بيديك برفق — هذا يُلطّف قوام الكرنب.",
      "اتركيها ١٠ دقائق قبل التقديم لتتشرّب النكهات.",
    ],
  },
  {
    id: "braised-leeks-fennel",
    name: "Braised Leeks & Fennel", nameAr: "كراث وشمر مطهو ببطء",
    tagline: "Gentle, savory, and elegant on the side", taglineAr: "طبق جانبي لطيف ومذاق راقٍ",
    produce: ["Leek", "Fennel", "Garlic"],
    pantry: ["Vegetable stock", "Butter or olive oil", "Black pepper"],
    pantryAr: ["مرق خضار", "زبدة أو زيت زيتون", "فلفل أسود"],
    steps: [
      "Trim and halve the leeks and fennel lengthwise.",
      "Sear cut-side down in butter or oil until golden, a few minutes.",
      "Add crushed garlic and enough stock to come halfway up the vegetables, then cover and simmer 15–20 minutes until tender.",
      "Season with black pepper and serve warm as a side.",
    ],
    stepsAr: [
      "نظّفي الكراث والشمر وقطّعيهما أنصافًا بالطول.",
      "حمّريهما من جهة القطع في الزبدة أو الزيت حتى يصبحا ذهبيين، لعدة دقائق.",
      "أضيفي الثوم المهروس وكمية من المرق تغطي نصف الخضار، ثم غطي القدر واتركيه على نار هادئة ١٥-٢٠ دقيقة حتى تنضج.",
      "تبّليه بالفلفل الأسود وقدّميه دافئًا كطبق جانبي.",
    ],
  },
  {
    id: "roasted-brussels-sprouts",
    name: "Roasted Brussels Sprouts with Garlic", nameAr: "كرنب بروكسل مشوي بالثوم",
    tagline: "Crispy edges, caramelized and savory", taglineAr: "حواف مقرمشة ونكهة مكرملة",
    produce: ["Brussels Sprouts", "Garlic", "Lemon"],
    pantry: ["Olive oil", "Salt & pepper", "Parmesan (optional)"],
    pantryAr: ["زيت زيتون", "ملح وفلفل", "جبنة بارميزان (اختياري)"],
    steps: [
      "Halve the Brussels sprouts and toss with olive oil, crushed garlic, salt, and pepper.",
      "Roast at 210°C, cut-side down, for 20–25 minutes until deeply golden.",
      "Finish with a squeeze of lemon juice right out of the oven.",
      "Grate over a little parmesan if using, and serve hot.",
    ],
    stepsAr: [
      "قطّعي كرنب بروكسل أنصافًا وقلّبيه مع زيت الزيتون والثوم المهروس والملح والفلفل.",
      "اشويه على ٢١٠ درجة مئوية، من جهة القطع للأسفل، لمدة ٢٠-٢٥ دقيقة حتى يصبح ذهبيًا غامقًا.",
      "أضيفي عصير الليمون فور إخراجه من الفرن.",
      "ابشري قليلًا من جبنة البارميزان إن أردتِ، وقدّميه ساخنًا.",
    ],
  },
  {
    id: "snap-peas-sautee",
    name: "Sautéed Snow Peas & Sugar Snap Peas", nameAr: "بازلاء الثلج والسكر المقلية",
    tagline: "Quick, crisp, and bright green", taglineAr: "سريعة ومقرمشة وخضراء نضرة",
    produce: ["Snow Peas", "Sugar Snap Peas", "Garlic", "Green Chili"],
    pantry: ["Sesame oil", "Soy sauce", "Sesame seeds"],
    pantryAr: ["زيت سمسم", "صويا صوص", "بذور سمسم"],
    steps: [
      "Trim the snow peas and sugar snap peas.",
      "Heat sesame oil in a wok or wide pan over high heat, then add sliced garlic and chili.",
      "Toss in the peas and stir-fry for 2–3 minutes only, until just tender-crisp.",
      "Finish with a splash of soy sauce and a sprinkle of sesame seeds.",
    ],
    stepsAr: [
      "نظّفي بازلاء الثلج وبازلاء السكر.",
      "سخّني زيت السمسم في مقلاة واسعة على نار عالية، ثم أضيفي الثوم والفلفل الحار المقطّع شرائح.",
      "أضيفي البازلاء وقلّبيها سريعًا لمدة ٢-٣ دقائق فقط حتى تصبح مقرمشة ونيّئة بالكاد.",
      "أضيفي قليلًا من صوص الصويا ورشّي بذور السمسم في النهاية.",
    ],
  },
  {
    id: "mushroom-medley",
    name: "Garlic Butter Mushroom Medley", nameAr: "تشكيلة فطر بالثوم والزبدة",
    tagline: "Portobello, shiitake & oyster, all in one pan", taglineAr: "بورتوبيلو وشيتاكي ومحاري في مقلاة واحدة",
    produce: ["Portobello", "Shiitake", "Oyster Mushroom", "Garlic", "Rosemary"],
    pantry: ["Butter", "Olive oil", "Black pepper"],
    pantryAr: ["زبدة", "زيت زيتون", "فلفل أسود"],
    steps: [
      "Slice all the mushrooms into similar-sized pieces.",
      "Heat butter and olive oil together in a wide pan over medium-high heat.",
      "Add the mushrooms in a single layer and let them sit undisturbed for a minute before stirring, so they brown rather than steam.",
      "Add crushed garlic and a sprig of rosemary in the last minute, season with black pepper, and serve hot.",
    ],
    stepsAr: [
      "قطّعي كل أنواع الفطر إلى قطع متقاربة الحجم.",
      "سخّني الزبدة وزيت الزيتون معًا في مقلاة واسعة على نار متوسطة إلى عالية.",
      "أضيفي الفطر في طبقة واحدة واتركيه دون تحريك لدقيقة قبل التقليب، ليأخذ لونًا ذهبيًا بدل أن يتبخر.",
      "أضيفي الثوم المهروس وغصن إكليل الجبل في الدقيقة الأخيرة، تبّليه بالفلفل الأسود وقدّميه ساخنًا.",
    ],
  },
  {
    id: "grilled-asparagus-lemon",
    name: "Grilled Asparagus with Lemon", nameAr: "هليون مشوي بالليمون",
    tagline: "Simple, elegant, and quick to make", taglineAr: "طبق أنيق وبسيط وسريع التحضير",
    produce: ["Asparagus", "Lemon", "Garlic"],
    pantry: ["Olive oil", "Salt & pepper", "Parmesan shavings (optional)"],
    pantryAr: ["زيت زيتون", "ملح وفلفل", "شرائح جبنة بارميزان (اختياري)"],
    steps: [
      "Trim the woody ends off the asparagus.",
      "Toss with olive oil, crushed garlic, salt, and pepper.",
      "Grill or roast at high heat for 6–8 minutes, turning once, until tender with light char marks.",
      "Finish with a good squeeze of lemon juice and parmesan shavings, if using.",
    ],
    stepsAr: [
      "أزيلي الأطراف الخشبية من الهليون.",
      "قلّبيه مع زيت الزيتون والثوم المهروس والملح والفلفل.",
      "اشويه على نار عالية لمدة ٦-٨ دقائق مع التقليب مرة واحدة، حتى يلين ويظهر عليه أثر الشوي.",
      "أضيفي عصير الليمون بسخاء وشرائح جبنة البارميزان إن أردتِ.",
    ],
  },
  {
    id: "watercress-basil-salad",
    name: "Watercress & Basil Salad", nameAr: "سلطة جرجير الماء والريحان",
    tagline: "Peppery, fragrant, and refreshing", taglineAr: "منعشة وعطرية بلمسة حارة خفيفة",
    produce: ["Watercress", "Basil", "Lemon", "Cherry Tomato"],
    pantry: ["Olive oil", "Pine nuts (toasted)", "Soft cheese"],
    pantryAr: ["زيت زيتون", "صنوبر محمّص", "جبنة طرية"],
    steps: [
      "Wash and dry the watercress and basil leaves well.",
      "Halve the cherry tomatoes and toss everything with olive oil and lemon juice.",
      "Scatter over toasted pine nuts and crumbled soft cheese.",
      "Serve immediately, while the leaves are crisp.",
    ],
    stepsAr: [
      "اغسلي أوراق جرجير الماء والريحان جيدًا وجففيها.",
      "قطّعي الطماطم الكرزية أنصافًا وقلّبي كل المكونات مع زيت الزيتون وعصير الليمون.",
      "انثري الصنوبر المحمّص والجبنة الطرية المفرومة فوق السلطة.",
      "قدّميها فورًا بينما الأوراق لا تزال مقرمشة.",
    ],
  },
  {
    id: "ratatouille",
    name: "Ratatouille", nameAr: "راتاتوي",
    tagline: "French stewed summer vegetables", taglineAr: "طبخة خضار صيفية فرنسية",
    produce: ["Zucchini", "Eggplant", "Bell Pepper (Red)", "Tomato", "Garlic", "Yellow Onion"],
    pantry: ["Olive oil", "Fresh thyme", "Salt & pepper"],
    pantryAr: ["زيت زيتون", "زعتر طازج", "ملح وفلفل"],
    steps: [
      "Dice the zucchini, eggplant, bell pepper, tomato and onion into similar-sized cubes.",
      "Sauté the onion and garlic in olive oil until soft, then add the eggplant and cook a few minutes.",
      "Add the remaining vegetables and thyme, and simmer uncovered until everything is tender and slightly jammy.",
      "Season to taste and serve warm as a side, or over rice or crusty bread.",
    ],
    stepsAr: [
      "قطّعي الكوسا والباذنجان والفلفل والطماطم والبصل إلى مكعبات متقاربة الحجم.",
      "قلّبي البصل والثوم في زيت الزيتون حتى يلين، ثم أضيفي الباذنجان واطبخيه بضع دقائق.",
      "أضيفي باقي الخضار والزعتر واتركيها على نار هادئة دون غطاء حتى تنضج وتتماسك قليلًا.",
      "تبّليها حسب الرغبة وقدّميها دافئة كطبق جانبي أو مع الأرز أو الخبز المقرمش.",
    ],
  },
  {
    id: "borscht",
    name: "Borscht", nameAr: "بورش",
    tagline: "Russian beetroot & cabbage soup", taglineAr: "شوربة الشمندر والملفوف الروسية",
    produce: ["Beetroot", "White Cabbage", "Potato", "Carrot", "Yellow Onion", "Garlic", "Dill"],
    pantry: ["Beef or vegetable stock", "Tomato paste", "Sour cream, to serve", "Bay leaf", "Salt & pepper"],
    pantryAr: ["مرق لحم أو خضار", "معجون طماطم", "قشدة حامضة للتقديم", "ورق غار", "ملح وفلفل"],
    steps: [
      "Grate the beetroot and carrot, and shred the cabbage; dice the potato and onion.",
      "Sauté the onion, carrot and garlic, then stir in the tomato paste and beetroot.",
      "Add the stock, potato, cabbage and bay leaf, and simmer until all the vegetables are tender.",
      "Ladle into bowls, top with a spoonful of sour cream and a scatter of fresh dill.",
    ],
    stepsAr: [
      "ابشري الشمندر والجزر وقطّعي الملفوف إلى شرائح رفيعة، وقطّعي البطاطس والبصل مكعبات.",
      "قلّبي البصل والجزر والثوم، ثم أضيفي معجون الطماطم والشمندر.",
      "أضيفي المرق والبطاطس والملفوف وورق الغار، واتركيها على نار هادئة حتى تنضج كل الخضار.",
      "قدّميها في أطباق مع ملعقة من القشدة الحامضة ورشة من الشبت الطازج.",
    ],
  },
  {
    id: "olivier-salad",
    name: "Olivier (Russian) Salad", nameAr: "سلطة أوليفيه الروسية",
    tagline: "Creamy diced vegetable & potato salad", taglineAr: "سلطة بطاطس وخضار مقطعة بصلصة كريمية",
    produce: ["Potato", "Carrot", "Green Peas", "Yellow Onion"],
    pantry: ["Boiled eggs", "Pickled cucumbers", "Mayonnaise", "Boiled chicken or bologna (optional)", "Salt"],
    pantryAr: ["بيض مسلوق", "مخلل خيار", "مايونيز", "دجاج مسلوق أو مرتديلا (اختياري)", "ملح"],
    steps: [
      "Boil the potato and carrot until just tender, then cool and dice into small cubes.",
      "Finely dice the pickled cucumbers, onion and boiled eggs to match.",
      "Combine everything in a bowl with the peas and a generous spoonful of mayonnaise.",
      "Mix gently until evenly coated, season with salt, and chill before serving.",
    ],
    stepsAr: [
      "اسلقي البطاطس والجزر حتى ينضجا قليلًا، ثم دعيهما يبردا وقطّعيهما مكعبات صغيرة.",
      "قطّعي المخلل والبصل والبيض المسلوق مكعبات صغيرة بنفس الحجم تقريبًا.",
      "اخلطي كل شيء في وعاء مع البازلاء وملعقة سخية من المايونيز.",
      "قلّبي برفق حتى يتغطى كل شيء بالتساوي، تبّلي بالملح وبرّديها قبل التقديم.",
    ],
  },
  {
    id: "mjadara",
    name: "Mjadara (Lentils & Rice)", nameAr: "مجدرة عدس بالأرز",
    tagline: "Lentils and rice topped with caramelized onions", taglineAr: "عدس وأرز مغطى بالبصل المكرمل",
    produce: ["Yellow Onion", "Garlic"],
    pantry: ["Brown or green lentils", "Rice", "Cumin", "Olive oil", "Salt"],
    pantryAr: ["عدس بني أو أخضر", "أرز", "كمون", "زيت زيتون", "ملح"],
    steps: [
      "Boil the lentils until just tender, about 15 minutes, then add the rice and enough water to cook both together.",
      "Meanwhile, slice the onions thinly and fry slowly in olive oil until deeply caramelized — don't rush this step.",
      "Stir crushed garlic and cumin into the lentils and rice for the last few minutes of cooking.",
      "Serve topped generously with the caramelized onions, with a side of plain yogurt if you like.",
    ],
    stepsAr: [
      "اسلقي العدس حتى ينضج قليلًا، حوالي ١٥ دقيقة، ثم أضيفي الأرز وكمية كافية من الماء لطهيهما معًا.",
      "في هذه الأثناء، قطّعي البصل شرائح رفيعة وحمّريه ببطء في زيت الزيتون حتى يتكرمل جيدًا — لا تستعجلي هذه الخطوة.",
      "أضيفي الثوم المهروس والكمون إلى العدس والأرز في آخر دقائق الطهي.",
      "قدّميها مغطاة بسخاء بالبصل المكرمل، مع اللبن الرائب إذا أحببت.",
    ],
  },
  {
    id: "foul-medames",
    name: "Foul Medames", nameAr: "فول مدمس",
    tagline: "Warm stewed fava beans, a Levantine breakfast staple", taglineAr: "فول مدمس دافئ، طبق فطور شامي أساسي",
    produce: ["Broad Beans (Fava)", "Garlic", "Lemon", "Tomato", "Parsley"],
    pantry: ["Olive oil", "Cumin", "Salt"],
    pantryAr: ["زيت زيتون", "كمون", "ملح"],
    steps: [
      "Warm the fava beans gently with a splash of their liquid (or water) until heated through.",
      "Mash lightly with a fork, leaving some texture, and stir in crushed garlic, lemon juice and cumin.",
      "Spoon into a bowl and top with diced tomato and chopped parsley.",
      "Finish with a generous drizzle of olive oil and serve warm with bread.",
    ],
    stepsAr: [
      "سخّني الفول برفق مع رشة من سائله (أو الماء) حتى يسخن تمامًا.",
      "اهرسيه قليلًا بالشوكة مع ترك بعض القوام، وأضيفي الثوم المهروس وعصير الليمون والكمون.",
      "ضعيه في طبق وزيّنيه بمكعبات الطماطم والبقدونس المفروم.",
      "أنهيه بكمية سخية من زيت الزيتون وقدّميه دافئًا مع الخبز.",
    ],
  },
  {
    id: "minestrone",
    name: "Minestrone Soup", nameAr: "شوربة مينستروني",
    tagline: "Hearty Italian vegetable & pasta soup", taglineAr: "شوربة إيطالية غنية بالخضار والمعكرونة",
    produce: ["Zucchini", "Carrot", "Celery", "Tomato", "White Cabbage", "Garlic", "Yellow Onion", "Basil"],
    pantry: ["Small pasta or beans", "Vegetable stock", "Olive oil", "Salt & pepper", "Parmesan, to serve"],
    pantryAr: ["معكرونة صغيرة أو فاصولياء", "مرق خضار", "زيت زيتون", "ملح وفلفل", "جبنة بارميزان للتقديم"],
    steps: [
      "Dice the carrot, celery and onion, and sauté in olive oil until softened.",
      "Add the garlic, chopped tomato, cabbage and zucchini, and cook a few minutes more.",
      "Pour in the stock, bring to a simmer, and add the pasta or beans until tender.",
      "Finish with torn basil, season to taste, and serve with grated parmesan.",
    ],
    stepsAr: [
      "قطّعي الجزر والكرفس والبصل مكعبات وقلّبيها في زيت الزيتون حتى تلين.",
      "أضيفي الثوم والطماطم المقطعة والملفوف والكوسا واطبخي بضع دقائق أخرى.",
      "أضيفي المرق واتركيه حتى يغلي برفق، ثم أضيفي المعكرونة أو الفاصولياء حتى تنضج.",
      "أنهيها بأوراق الريحان الممزقة، تبّلي حسب الرغبة وقدّميها مع جبنة البارميزان المبشورة.",
    ],
  },
  {
    id: "coleslaw",
    name: "Coleslaw", nameAr: "سلطة كول سلو",
    tagline: "Crunchy cabbage & carrot salad", taglineAr: "سلطة ملفوف وجزر مقرمشة",
    produce: ["White Cabbage", "Carrot", "Red Onion"],
    pantry: ["Mayonnaise", "White vinegar", "Sugar", "Salt & pepper"],
    pantryAr: ["مايونيز", "خل أبيض", "سكر", "ملح وفلفل"],
    steps: [
      "Finely shred the cabbage and grate the carrot; thinly slice the red onion.",
      "Whisk together mayonnaise, a splash of vinegar and a pinch of sugar for the dressing.",
      "Toss the vegetables with the dressing until evenly coated.",
      "Chill for at least 20 minutes before serving so the flavors settle.",
    ],
    stepsAr: [
      "قطّعي الملفوف شرائح رفيعة جدًا وابشري الجزر، وقطّعي البصل الأحمر شرائح رفيعة.",
      "اخفقي المايونيز مع رشة من الخل وقليل من السكر لعمل التتبيلة.",
      "قلّبي الخضار مع التتبيلة حتى تتغطى بالتساوي.",
      "برّديها لمدة ٢٠ دقيقة على الأقل قبل التقديم حتى تتداخل النكهات.",
    ],
  },
  {
    id: "vinegret",
    name: "Vinegret (Russian Beet Salad)", nameAr: "فينيغريت (سلطة الشمندر الروسية)",
    tagline: "Diced beetroot, potato & pickle salad with oil dressing", taglineAr: "سلطة شمندر وبطاطس ومخلل بتتبيلة الزيت",
    produce: ["Beetroot", "Potato", "Carrot", "Yellow Onion"],
    pantry: ["Pickled cucumbers", "Sauerkraut (optional)", "Vegetable oil", "Vinegar", "Salt"],
    pantryAr: ["مخلل خيار", "ملفوف مخلل (اختياري)", "زيت نباتي", "خل", "ملح"],
    steps: [
      "Boil the beetroot, potato and carrot separately until tender, then cool and dice into small, even cubes.",
      "Finely dice the pickled cucumbers and onion to match.",
      "Combine everything in a bowl with the sauerkraut, if using.",
      "Dress with vegetable oil, a splash of vinegar and salt, and chill before serving.",
    ],
    stepsAr: [
      "اسلقي الشمندر والبطاطس والجزر كل على حدة حتى ينضجوا، ثم دعيهم يبردوا وقطّعيهم مكعبات صغيرة متساوية.",
      "قطّعي المخلل والبصل مكعبات صغيرة بنفس الحجم.",
      "اخلطي كل شيء في وعاء مع الملفوف المخلل إن أردت.",
      "تبّليها بالزيت النباتي ورشة من الخل والملح، وبرّديها قبل التقديم.",
    ],
  },
  {
    id: "draniki",
    name: "Draniki (Potato Pancakes)", nameAr: "درانيكي (فطائر البطاطس)",
    tagline: "Crispy pan-fried potato & onion pancakes", taglineAr: "فطائر بطاطس وبصل مقلية ومقرمشة",
    produce: ["Potato", "Yellow Onion"],
    pantry: ["Egg", "Flour", "Vegetable oil for frying", "Salt & pepper", "Sour cream, to serve"],
    pantryAr: ["بيضة", "طحين", "زيت نباتي للقلي", "ملح وفلفل", "قشدة حامضة للتقديم"],
    steps: [
      "Grate the potato and onion together, then squeeze out as much excess liquid as possible.",
      "Mix in the egg, a spoonful of flour, salt and pepper until combined.",
      "Fry spoonfuls flattened into patties in hot oil until golden and crisp on both sides.",
      "Drain briefly and serve hot with a dollop of sour cream.",
    ],
    stepsAr: [
      "ابشري البطاطس والبصل معًا، ثم اعصريهما جيدًا للتخلص من أكبر قدر ممكن من السائل الزائد.",
      "أضيفي البيضة وملعقة من الطحين والملح والفلفل واخلطي جيدًا.",
      "اقلي ملاعق من الخليط مسطحة على شكل أقراص في زيت ساخن حتى تذهّب وتقرمش من الجهتين.",
      "صفّيها قليلًا وقدّميها ساخنة مع ملعقة من القشدة الحامضة.",
    ],
  },
];

const AR_CATEGORY = {
  "Everyday Essentials": "الأساسيات اليومية",
  "Bulbs": "البصليات",
  "Leafy Greens": "الخضروات الورقية",
  "Fresh Herbs": "الأعشاب الطازجة",
  "Brassicas": "الخضروات الصليبية",
  "Beans & Peas": "الفول والبازلاء",
  "Mushrooms": "الفطر",
  "Specialty Vegetables": "خضروات مميزة",
  "Middle Eastern Favorites": "أطباق شرق أوسطية مفضلة",
  "Fruits": "الفواكه",
};
const AR_NAME = {
  "Tomato": "طماطم", "Cherry Tomato": "طماطم كرزية", "Cucumber": "خيار",
  "Bell Pepper (Red)": "فلفل رومي أحمر", "Bell Pepper (Green)": "فلفل رومي أخضر", "Bell Pepper (Yellow)": "فلفل رومي أصفر",
  "Potato": "بطاطا", "Carrot": "جزر", "Eggplant": "باذنجان", "Zucchini": "كوسا",
  "Lemon": "ليمون", "Chili Pepper": "فلفل حار", "Green Chili": "فلفل أخضر حار", "Jalapeno": "هالبينو", "Sweet Potato": "بطاطا حلوة", "Beetroot": "شمندر", "Bell Pepper (Orange)": "فلفل حلو برتقالي", "Baby Eggplant": "باذنجان صغير", "Baby Potato": "بطاطا صغيرة", "Mini Cucumber": "خيار صغير", "Yellow Squash": "كوسا صفراء", "Red Radish": "فجل أحمر", "White Radish": "فجل أبيض", "Pumpkin": "يقطين", "Turnip": "لفت", "Parsnip": "جزر أبيض", "Okra": "بامية",
  "Yellow Onion": "بصل أصفر", "Red Onion": "بصل أحمر", "White Onion": "بصل أبيض",
  "Shallots": "بصل شالوت", "Garlic": "ثوم", "Fresh Garlic": "ثوم طازج",
  "Lettuce (Iceberg)": "خس أيسبرغ", "Romaine Lettuce": "خس روماني", "Green Leaf Lettuce": "خس أخضر",
  "Red Leaf Lettuce": "خس أحمر", "Spinach": "سبانخ", "Kale": "كيل",
  "Swiss Chard": "سلق", "Rocket (Arugula)": "جرجير", "Watercress": "جرجير الماء",
  "Parsley": "بقدونس", "Coriander (Cilantro)": "كزبرة", "Mint": "نعناع",
  "Dill": "شبت", "Celery": "كرفس", "Basil": "ريحان",
  "Thyme": "زعتر", "Rosemary": "إكليل الجبل", "Sage": "مريمية", "Oregano": "أوريغانو",
  "Broccoli": "بروكلي", "Cauliflower": "قرنبيط", "White Cabbage": "ملفوف أبيض",
  "Red Cabbage": "ملفوف أحمر", "Chinese Cabbage": "ملفوف صيني", "Brussels Sprouts": "كرنب بروكسل",
  "Green Beans": "فاصوليا خضراء", "French Beans": "فاصوليا فرنسية", "Snow Peas": "بازلاء ثلجية",
  "Sugar Snap Peas": "بازلاء سكرية", "Green Peas": "بازلاء خضراء", "Broad Beans (Fava)": "فول",
  "White Mushroom": "فطر أبيض", "Brown Mushroom": "فطر بني", "Portobello": "فطر بورتوبيلو",
  "Oyster Mushroom": "فطر المحار", "Shiitake": "فطر شيتاكي",
  "Asparagus": "هليون", "Artichoke": "أرضي شوكي", "Leek": "كراث",
  "Fennel": "شمر", "Celeriac": "كرفس جذري", "Rhubarb (Seasonal)": "راوند (موسمي)",
  "Corn": "ذرة", "Baby Corn": "ذرة صغيرة",
  "Molokhia": "ملوخية", "Vine Leaves": "ورق عنب", "Purslane": "بقلة",
  "Green Fava Beans": "فول أخضر", "Fresh Broad Beans": "فول طازج",
  "Kousa (Light Green Zucchini)": "كوسا فاتح", "Green Almonds (Seasonal)": "لوز أخضر (موسمي)",
  "Apple": "تفاح", "Banana": "موز", "Orange": "برتقال", "Grapes (Red)": "عنب أحمر", "Grapes (Green)": "عنب أخضر",
  "Strawberry": "فراولة", "Mango": "مانجو", "Kiwi": "كيوي", "Pineapple": "أناناس",
  "Pomegranate": "رمان", "Pear": "كمثرى", "Honey Peach": "خوخ عسلي", "Dragon Fruit": "فاكهة التنين", "Mandarin": "يوسفي", "Blueberries": "توت أزرق", "3 Colour Apples": "تفاح ثلاثي الألوان", "Cherry": "كرز", "Flat Peach": "خوخ مفلطح", "Blackberry": "توت أسود", "Raspberry": "توت العليق", "Apricot": "مشمش", "Kibbeh": "كبة", "Meat Sambousek": "سمبوسة لحمة", "Cheese Sambousek": "سمبوسة جبنة", "Artisanal Spice Collection": "مجموعة توابل حرفية", "Sidr Honey & Fig Preserves Set": "طقم عسل السدر ومربى التين", "Honey Jar": "برطمان عسل", "Zaatar Trio Box": "علبة زعتر ثلاثية", "Premium Mixed Nuts Gift Box": "علبة هدايا مكسرات فاخرة", "Premium Extra Virgin Olive Oil": "زيت زيتون بكر ممتاز فاخر",
};
const AR_UNIT = { kg: "كجم", bunch: "حزمة", piece: "قطعة", "250g": "250غ", box: "صندوق", set: "طقم" };
function localName(name, lang) {
  return lang === "ar" ? AR_NAME[name] || name : name;
}
function localCategory(cat, lang) {
  return lang === "ar" ? AR_CATEGORY[cat] || cat : cat;
}
function localUnit(unit, lang) {
  return lang === "ar" ? AR_UNIT[unit] || unit : unit;
}


function slugify(s) {
  return s.toLowerCase().replace(/[()]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// Longer marketing descriptions — currently only written for Gourmet & Gifts
// items, where the extra detail actually earns its place (a fruit or veg
// doesn't need a paragraph, but a gift item benefits from one). Add more
// keys here as needed; anything without an entry just shows no description.
const PRODUCT_DESCRIPTION = {
  "Artisanal Spice Collection": "A curated set of four signature spices — tangy sumac, our exquisite mixed spice blend, rich pomegranate molasses, and coarse Aleppo pepper — presented in a keepsake wooden stand. Perfect for elevating everyday cooking, or gifting to someone who loves bold Middle Eastern flavor.",
  "Sidr Honey & Fig Preserves Set": "Rich Sidr honey paired with sweet fig preserves, a timeless combination from the region's finest orchards. A warm, thoughtful gift — or a treat for your own breakfast table.",
  "Honey Jar": "Pure, raw honey in a single jar — the same rich Sidr honey from our Preserves Set, on its own. A simple, natural everyday treat or a lovely small gift.",
  "Zaatar Trio Box": "Three signature za'atar blends in one gift-ready set — Classic, Green, and Spicy — each hand-mixed for a different mood at the table. A staple of any Middle Eastern kitchen.",
  "Premium Mixed Nuts Gift Box": "A generous assortment of pistachios, almonds, cashews, and a fruit-and-nut mix, presented in an elegant keepsake box. A crowd-pleasing gift for any occasion.",
  "Premium Extra Virgin Olive Oil": "First cold-pressed, single-origin extra virgin olive oil. Rich, smooth, and full of flavor — for everyday cooking or gifting.",
  "Kibbeh": "Hand-shaped frozen fried kibbeh, ready to reheat. Presented in a luxury sliding drawer box finished in matte emerald green with blind-embossed botanical patterns and a gold-trimmed display window.",
  "Meat Sambousek": "Delicate, uncooked frozen pastries filled with seasoned meat. Presented in a geometric hexagon box with a gold-foil-trimmed display window and matte forest-green finish.",
  "Cheese Sambousek": "Delicate, uncooked frozen pastries filled with frosted cheese. Presented in a gatefold heritage chest box in deep dark-green leatherette, opening to reveal gold-lined trays.",
};
const PRODUCT_DESCRIPTION_AR = {
  "Artisanal Spice Collection": "مجموعة مختارة من أربعة توابل أصيلة — سماق حامض، وتوابلنا المشكّلة الفاخرة، ودبس رمان غني، وفلفل حلبي خشن — معروضة على حامل خشبي أنيق. مثالية لإضافة نكهة شرق أوسطية غنية لطبخك اليومي، أو كهدية لمن يحب النكهات القوية.",
  "Sidr Honey & Fig Preserves Set": "عسل السدر الفاخر مع مربى التين الحلو، مزيج كلاسيكي من أجود بساتين المنطقة. هدية دافئة ومميزة — أو إضافة رائعة لمائدة الفطور.",
  "Honey Jar": "عسل نقي وخام في برطمان واحد — نفس عسل السدر الغني من طقم المربى، بمفرده. لذة يومية بسيطة وطبيعية أو هدية صغيرة لطيفة.",
  "Zaatar Trio Box": "ثلاث خلطات زعتر أصيلة في طقم واحد جاهز للإهداء — كلاسيك وأخضر وحار — كل واحدة ممزوجة يدويًا لمزاج مختلف على المائدة. عنصر أساسي في أي مطبخ شرق أوسطي.",
  "Premium Mixed Nuts Gift Box": "تشكيلة سخية من الفستق واللوز والكاجو ومزيج الفواكه والمكسرات، معروضة في علبة أنيقة. هدية تسعد الجميع في أي مناسبة.",
  "Premium Extra Virgin Olive Oil": "زيت زيتون بكر ممتاز، معصور على البارد من منشأ واحد. غني ونقي ومليء بالنكهة، للطبخ اليومي أو كهدية مميزة.",
  "Kibbeh": "كبة مقلية مفرزة مشكّلة يدويًا، جاهزة لإعادة التسخين. معروضة في علبة درج انزلاقية فاخرة بلمسة نهائية خضراء زمردية مطفية مع نقوش نباتية بارزة ونافذة عرض بحواف ذهبية.",
  "Meat Sambousek": "معجنات لحمة نيئة مفرزة برائحة التوابل الشهية. معروضة في علبة سداسية هندسية بنافذة عرض بحواف ذهبية ولمسة نهائية خضراء غابية مطفية.",
  "Cheese Sambousek": "معجنات جبنة نيئة مفرزة رقيقة. معروضة في علبة صندوق تراثي بفتحة مزدوجة من الجلد الأخضر الداكن الفاخر، تُفتح لتكشف عن صواني مذهّبة قابلة للإزالة.",
};
const PRODUCT_STORAGE_TIP = {
  "Tomato": "Store at room temperature, away from direct sun — refrigeration dulls the flavor. Best within 5–7 days.",
  "Cherry Tomato": "Store at room temperature, away from direct sun. Best within 4–6 days.",
  "Cucumber": "Refrigerate in a bag. Best within 5–7 days.",
  "Mini Cucumber": "Refrigerate in a bag. Best within 5–7 days.",
  "Bell Pepper (Red)": "Refrigerate in the crisper drawer. Best within 7–10 days.",
  "Bell Pepper (Green)": "Refrigerate in the crisper drawer. Best within 7–10 days.",
  "Bell Pepper (Yellow)": "Refrigerate in the crisper drawer. Best within 7–10 days.",
  "Bell Pepper (Orange)": "Refrigerate in the crisper drawer. Best within 7–10 days.",
  "Potato": "Store in a cool, dark, dry place — not the fridge. Best within 2–4 weeks.",
  "Baby Potato": "Store in a cool, dark, dry place — not the fridge. Best within 2–3 weeks.",
  "Sweet Potato": "Store in a cool, dark, dry place — not the fridge. Best within 2–4 weeks.",
  "Carrot": "Refrigerate in a bag. Best within 2–3 weeks.",
  "Eggplant": "Refrigerate. Best within 5–7 days.",
  "Baby Eggplant": "Refrigerate. Best within 5–7 days.",
  "Zucchini": "Refrigerate. Best within 5–7 days.",
  "Yellow Squash": "Refrigerate. Best within 5–7 days.",
  "Lemon": "Room temperature for a few days, or refrigerate for longer. Best within 2–3 weeks refrigerated.",
  "Chili Pepper": "Refrigerate. Best within 7–10 days.",
  "Green Chili": "Refrigerate. Best within 7–10 days.",
  "Jalapeno": "Refrigerate. Best within 7–10 days.",
  "Beetroot": "Refrigerate (remove any leafy tops first). Best within 2–3 weeks.",
  "Red Radish": "Refrigerate. Best within 1–2 weeks.",
  "White Radish": "Refrigerate. Best within 1–2 weeks.",
  "Lettuce (Iceberg)": "Refrigerate in a bag with a paper towel to absorb moisture. Best within 5–7 days.",
  "Romaine Lettuce": "Refrigerate in a bag with a paper towel to absorb moisture. Best within 5–7 days.",
  "Green Leaf Lettuce": "Refrigerate in a bag with a paper towel to absorb moisture. Best within 5–7 days.",
  "Red Leaf Lettuce": "Refrigerate in a bag with a paper towel to absorb moisture. Best within 5–7 days.",
  "Spinach": "Refrigerate. Best within 3–5 days — one of the more delicate greens.",
  "Kale": "Refrigerate. Best within 5–7 days.",
  "Swiss Chard": "Refrigerate. Best within 5–7 days.",
  "Rocket (Arugula)": "Refrigerate. Best within 3–5 days — delicate, use it up quickly.",
  "Watercress": "Refrigerate, stems in a little water if possible. Best within 3–5 days.",
  "Parsley": "Trim stems and stand in a glass of water in the fridge, loosely covered. Best within 7–10 days this way.",
  "Coriander (Cilantro)": "Trim stems and stand in a glass of water in the fridge, loosely covered. Best within 7–10 days this way.",
  "Mint": "Trim stems and stand in a glass of water in the fridge, loosely covered. Best within 7–10 days this way.",
  "Dill": "Refrigerate wrapped in a damp paper towel. Best within 5–7 days.",
  "Celery": "Refrigerate wrapped in foil (not plastic) to stay crisp. Best within 2–3 weeks.",
  "Basil": "Keep at room temperature in a glass of water, like flowers — the fridge damages it. Best within 5–7 days.",
  "Thyme": "Refrigerate wrapped in a damp paper towel. Best within 2–3 weeks.",
  "Rosemary": "Refrigerate wrapped in a damp paper towel. Best within 2–3 weeks.",
  "Sage": "Refrigerate wrapped in a damp paper towel. Best within 2–3 weeks.",
  "Oregano": "Refrigerate wrapped in a damp paper towel. Best within 2–3 weeks.",
};
const PRODUCT_STORAGE_TIP_AR = {
  "Tomato": "تُحفظ في درجة حرارة الغرفة بعيدًا عن أشعة الشمس المباشرة — التبريد يُفقدها نكهتها. تبقى طازجة لمدة ٥-٧ أيام.",
  "Cherry Tomato": "تُحفظ في درجة حرارة الغرفة بعيدًا عن الشمس. تبقى طازجة لمدة ٤-٦ أيام.",
  "Cucumber": "يُحفظ في الثلاجة داخل كيس. يبقى طازجًا لمدة ٥-٧ أيام.",
  "Mini Cucumber": "يُحفظ في الثلاجة داخل كيس. يبقى طازجًا لمدة ٥-٧ أيام.",
  "Bell Pepper (Red)": "يُحفظ في درج الخضار بالثلاجة. يبقى طازجًا لمدة ٧-١٠ أيام.",
  "Bell Pepper (Green)": "يُحفظ في درج الخضار بالثلاجة. يبقى طازجًا لمدة ٧-١٠ أيام.",
  "Bell Pepper (Yellow)": "يُحفظ في درج الخضار بالثلاجة. يبقى طازجًا لمدة ٧-١٠ أيام.",
  "Bell Pepper (Orange)": "يُحفظ في درج الخضار بالثلاجة. يبقى طازجًا لمدة ٧-١٠ أيام.",
  "Potato": "يُحفظ في مكان بارد ومظلم وجاف — وليس في الثلاجة. يبقى طازجًا لمدة ٢-٤ أسابيع.",
  "Baby Potato": "يُحفظ في مكان بارد ومظلم وجاف — وليس في الثلاجة. يبقى طازجًا لمدة ٢-٣ أسابيع.",
  "Sweet Potato": "يُحفظ في مكان بارد ومظلم وجاف — وليس في الثلاجة. يبقى طازجًا لمدة ٢-٤ أسابيع.",
  "Carrot": "يُحفظ في الثلاجة داخل كيس. يبقى طازجًا لمدة ٢-٣ أسابيع.",
  "Eggplant": "يُحفظ في الثلاجة. يبقى طازجًا لمدة ٥-٧ أيام.",
  "Baby Eggplant": "يُحفظ في الثلاجة. يبقى طازجًا لمدة ٥-٧ أيام.",
  "Zucchini": "يُحفظ في الثلاجة. يبقى طازجًا لمدة ٥-٧ أيام.",
  "Yellow Squash": "يُحفظ في الثلاجة. يبقى طازجًا لمدة ٥-٧ أيام.",
  "Lemon": "يُحفظ في درجة حرارة الغرفة لعدة أيام، أو في الثلاجة لمدة أطول. يبقى طازجًا حتى ٢-٣ أسابيع في الثلاجة.",
  "Chili Pepper": "يُحفظ في الثلاجة. يبقى طازجًا لمدة ٧-١٠ أيام.",
  "Green Chili": "يُحفظ في الثلاجة. يبقى طازجًا لمدة ٧-١٠ أيام.",
  "Jalapeno": "يُحفظ في الثلاجة. يبقى طازجًا لمدة ٧-١٠ أيام.",
  "Beetroot": "يُحفظ في الثلاجة (بعد إزالة الأوراق إن وجدت). يبقى طازجًا لمدة ٢-٣ أسابيع.",
  "Red Radish": "يُحفظ في الثلاجة. يبقى طازجًا لمدة ١-٢ أسبوع.",
  "White Radish": "يُحفظ في الثلاجة. يبقى طازجًا لمدة ١-٢ أسبوع.",
  "Lettuce (Iceberg)": "يُحفظ في الثلاجة داخل كيس مع منشفة ورقية لامتصاص الرطوبة. يبقى طازجًا لمدة ٥-٧ أيام.",
  "Romaine Lettuce": "يُحفظ في الثلاجة داخل كيس مع منشفة ورقية لامتصاص الرطوبة. يبقى طازجًا لمدة ٥-٧ أيام.",
  "Green Leaf Lettuce": "يُحفظ في الثلاجة داخل كيس مع منشفة ورقية لامتصاص الرطوبة. يبقى طازجًا لمدة ٥-٧ أيام.",
  "Red Leaf Lettuce": "يُحفظ في الثلاجة داخل كيس مع منشفة ورقية لامتصاص الرطوبة. يبقى طازجًا لمدة ٥-٧ أيام.",
  "Spinach": "يُحفظ في الثلاجة. يبقى طازجًا لمدة ٣-٥ أيام — من أكثر الخضار الورقية حساسية.",
  "Kale": "يُحفظ في الثلاجة. يبقى طازجًا لمدة ٥-٧ أيام.",
  "Swiss Chard": "يُحفظ في الثلاجة. يبقى طازجًا لمدة ٥-٧ أيام.",
  "Rocket (Arugula)": "يُحفظ في الثلاجة. يبقى طازجًا لمدة ٣-٥ أيام — حساس، يُفضّل استخدامه بسرعة.",
  "Watercress": "يُحفظ في الثلاجة، ويفضّل وضع السيقان في قليل من الماء. يبقى طازجًا لمدة ٣-٥ أيام.",
  "Parsley": "تُقلّم السيقان وتوضع في كوب ماء بالثلاجة مع تغطية خفيفة. تبقى طازجة لمدة ٧-١٠ أيام بهذه الطريقة.",
  "Coriander (Cilantro)": "تُقلّم السيقان وتوضع في كوب ماء بالثلاجة مع تغطية خفيفة. تبقى طازجة لمدة ٧-١٠ أيام بهذه الطريقة.",
  "Mint": "تُقلّم السيقان وتوضع في كوب ماء بالثلاجة مع تغطية خفيفة. يبقى طازجًا لمدة ٧-١٠ أيام بهذه الطريقة.",
  "Dill": "يُحفظ في الثلاجة ملفوفًا بمنشفة ورقية رطبة. يبقى طازجًا لمدة ٥-٧ أيام.",
  "Celery": "يُحفظ في الثلاجة ملفوفًا بورق ألمنيوم (وليس بلاستيك) ليبقى مقرمشًا. يبقى طازجًا لمدة ٢-٣ أسابيع.",
  "Basil": "يُحفظ في درجة حرارة الغرفة في كوب ماء كالزهور — الثلاجة تُتلفه. يبقى طازجًا لمدة ٥-٧ أيام.",
  "Thyme": "يُحفظ في الثلاجة ملفوفًا بمنشفة ورقية رطبة. يبقى طازجًا لمدة ٢-٣ أسابيع.",
  "Rosemary": "يُحفظ في الثلاجة ملفوفًا بمنشفة ورقية رطبة. يبقى طازجًا لمدة ٢-٣ أسابيع.",
  "Sage": "يُحفظ في الثلاجة ملفوفًا بمنشفة ورقية رطبة. يبقى طازجًا لمدة ٢-٣ أسابيع.",
  "Oregano": "يُحفظ في الثلاجة ملفوفًا بمنشفة ورقية رطبة. يبقى طازجًا لمدة ٢-٣ أسابيع.",
};
const PRODUCTS = CATALOG.flatMap(({ cat, items }) =>
  items.map(([name, unit, price]) => ({
    id: slugify(name),
    name,
    category: cat,
    unit,
    price,
    available: true,
    description: PRODUCT_DESCRIPTION[name] || null,
    descriptionAr: PRODUCT_DESCRIPTION_AR[name] || null,
    origin: null, // country of origin — set per-item in Backstage; UAE food labeling rules require this for imported items
    shippingMethod: null, // "Air Freight" | "Road Freight" | null — optional, marketing/freshness signal, not a compliance requirement
    storageTip: PRODUCT_STORAGE_TIP[name] || null,
    storageTipAr: PRODUCT_STORAGE_TIP_AR[name] || null,
  }))
);

/* Small/Medium/Big box pricing, computed from each item's existing per-unit
   price rather than hand-entered — weight-based items (kg / 250g) get
   250g/500g/1kg tiers, count-based items (bunch/piece/box) get 1/3/6-unit
   tiers, each with a modest bulk discount at the bigger sizes. */
const BOX_TIER_DEFS = {
  kg: [
    { key: "small", weight: "250 g", weightAr: "٢٥٠ غ", mult: 0.32, min: 3 },
    { key: "medium", weight: "500 g", weightAr: "٥٠٠ غ", mult: 0.58, min: 5 },
    { key: "big", weight: "1 kg", weightAr: "١ كجم", mult: 1.0, min: 8 },
  ],
  "250g": [
    { key: "small", weight: "250 g", weightAr: "٢٥٠ غ", mult: 1.0, min: 3 },
    { key: "medium", weight: "500 g", weightAr: "٥٠٠ غ", mult: 1.8, min: 5 },
    { key: "big", weight: "1 kg", weightAr: "١ كجم", mult: 3.2, min: 8 },
  ],
  bunch: [
    { key: "small", weight: "1 bunch", weightAr: "حزمة واحدة", mult: 1.0, min: 2 },
    { key: "medium", weight: "3 bunches", weightAr: "٣ حزم", mult: 2.7, min: 4 },
    { key: "big", weight: "6 bunches", weightAr: "٦ حزم", mult: 4.8, min: 7 },
  ],
  piece: [
    { key: "small", weight: "1 piece", weightAr: "قطعة واحدة", mult: 1.0, min: 2 },
    { key: "medium", weight: "3 pieces", weightAr: "٣ قطع", mult: 2.7, min: 4 },
    { key: "big", weight: "6 pieces", weightAr: "٦ قطع", mult: 4.8, min: 7 },
  ],
};
BOX_TIER_DEFS.box = BOX_TIER_DEFS.piece;
function computeBoxTiers(product) {
  const basePrice = effectivePrice(product);
  const onSale = basePrice !== product.price;
  // Per-item override set in Backstage (📦 button on piece/bunch items) —
  // takes priority over the generic shared defaults below, since "how many
  // pieces per box" genuinely varies by item (a strawberry box and a
  // cucumber box shouldn't have to share the same 1/3/6 split).
  if (product.tierPieces && (product.unit === "piece" || product.unit === "bunch")) {
    const { small, medium, big } = product.tierPieces;
    const unitLabel = product.unit === "bunch" ? "bunch" : "piece";
    const unitLabelAr = product.unit === "bunch" ? "حزمة" : "قطعة";
    const pluralAr = product.unit === "bunch" ? "حزم" : "قطع";
    const mk = (key, n) => ({
      key,
      weight: `${n} ${unitLabel}${n === 1 ? "" : "s"}`,
      weightAr: n === 1 ? `${unitLabelAr} واحدة` : `${n} ${pluralAr}`,
      price: Math.max(1, Math.round(basePrice * n)),
      originalPrice: onSale ? Math.max(1, Math.round(product.price * n)) : undefined,
    });
    return [mk("small", small), mk("medium", medium), mk("big", big)];
  }
  const defs = BOX_TIER_DEFS[product.unit] || BOX_TIER_DEFS.kg;
  return defs.map((d) => ({
    key: d.key,
    weight: d.weight,
    weightAr: d.weightAr,
    price: Math.max(d.min, Math.round(basePrice * d.mult)),
    originalPrice: onSale ? Math.max(d.min, Math.round(product.price * d.mult)) : undefined,
  }));
}
const BOX_SIZE_LABEL = {
  small: { en: "Small Box", ar: "صندوق صغير" },
  medium: { en: "Medium Box", ar: "صندوق متوسط" },
  big: { en: "Large Box", ar: "صندوق كبير" },
};

const BOXES = [
  {
    id: "box-daily",
    category: "Vegetables",
    available: true,
    name: "🌿 Daily Box",
    size: "Daily",
    weight: "8 items",
    pieceCount: 8,
    customizable: true,
    tag: "A light everyday refresh — you choose the produce",
    price: 49,
    blurb: "Everyday essentials in our signature matte box with gold foil logo.",
    features: ["Premium E-flute cardboard", "Matte lamination", "Gold foil logo", "Die-cut handles"],
    includes: [],
  },
  {
    id: "box-family",
    category: "Vegetables",
    available: true,
    name: "🏡 Family Box",
    size: "Family",
    weight: "15 items",
    pieceCount: 15,
    customizable: true,
    tag: "Perfect for families — you choose the produce",
    price: 89,
    blurb: "A fuller restock of vegetables and greens, packed for the week.",
    features: ["Double-wall cardboard", "Ventilation holes", "Reinforced handles", "Moisture resistant"],
    includes: [],
  },
  {
    id: "box-signature",
    category: "Vegetables",
    available: true,
    name: "👑 Signature Box",
    size: "Signature",
    weight: "20 items",
    pieceCount: 20,
    customizable: true,
    tag: "For premium & VIP clients — you choose the produce",
    price: 149,
    blurb: "Our rigid gift box with magnetic closure and ribbon handles, for entertaining or gifting.",
    features: ["Rigid gift box", "Magnetic closure", "Gold foil stamping", "Ribbon handles"],
    includes: [],
  },
  {
    id: "box-chef",
    category: "Vegetables",
    available: true,
    name: "🥗 Chef's Box",
    size: "Chef's",
    weight: "26 items",
    pieceCount: 26,
    customizable: true,
    tag: "For chefs, caterers & entertaining — you choose the produce",
    price: 199,
    blurb: "Our largest box — bulk vegetables and fresh herbs for serious cooking, catering, or hosting a crowd.",
    features: ["Heavy-duty double-wall cardboard", "Reinforced base", "Bulk portioning", "Ideal for events"],
    includes: [],
  },
  {
    id: "fruit-box-small",
    category: "Fruits",
    available: true,
    name: "🪵 Wooden Crate",
    size: "Small",
    weight: "8 pieces",
    pieceCount: 8,
    customizable: true,
    tag: "A light, everyday fruit mix — you choose the pieces",
    price: 59,
    blurb: "Pick any 8 pieces from our fresh fruit selection — your mix, your box, same great price.",
    features: ["Premium E-flute cardboard", "Matte lamination", "Gold foil logo", "Die-cut handles"],
    includes: [],
  },
  {
    id: "fruit-box-medium",
    category: "Fruits",
    available: true,
    name: "💐 Luxury Box",
    size: "Medium",
    weight: "15 pieces",
    pieceCount: 15,
    customizable: true,
    tag: "For families & healthy routines — you choose the pieces",
    price: 99,
    blurb: "Pick any 15 pieces from our fresh fruit selection — a fuller mix for the week, exactly how you like it.",
    features: ["Double-wall cardboard", "Ventilation holes", "Reinforced handles", "Moisture resistant"],
    includes: [],
  },
  {
    id: "fruit-box-large",
    category: "Fruits",
    available: true,
    name: "🎁 Signature Gift Box",
    size: "Premium",
    weight: "24 pieces",
    pieceCount: 24,
    customizable: true,
    tag: "For gifting & entertaining — you choose the pieces",
    price: 159,
    blurb: "Pick any 24 pieces from our fresh fruit selection — a gift-ready box, built exactly your way.",
    features: ["Rigid gift box", "Magnetic closure", "Gold foil stamping", "Ribbon handles"],
    includes: [],
  },
  {
    id: "box-kibbeh",
    category: "Frozen Foods",
    available: true,
    name: "🥟 Frozen Fried Kibbeh Box",
    size: "Signature",
    weight: "10 pieces",
    pieceCount: 10,
    customizable: false,
    tag: "Hand-shaped, ready to reheat",
    price: 45,
    blurb: "10 pieces of hand-shaped frozen fried kibbeh, in a luxury sliding drawer box finished in matte emerald green with blind-embossed botanical patterns and a gold-trimmed display window.",
    features: ["Sliding drawer box", "Matte emerald finish", "Blind-embossed pattern", "Gold-trimmed window"],
    includes: ["Kibbeh"],
  },
  {
    id: "box-meat-sambousek",
    category: "Frozen Foods",
    available: true,
    name: "🥩 Meat Sambousek Box",
    size: "Signature",
    weight: "10 pieces",
    pieceCount: 10,
    customizable: false,
    tag: "Uncooked, frozen, ready to fry",
    price: 35,
    blurb: "10 pieces of frozen meat-filled sambousek, in a geometric hexagon box with a gold-foil-trimmed display window and matte forest-green finish.",
    features: ["Hexagon lift-off box", "Gold geometric lattice", "Matte forest-green", "Full display window"],
    includes: ["Meat Sambousek"],
  },
  {
    id: "box-cheese-sambousek",
    category: "Frozen Foods",
    available: true,
    name: "🧀 Cheese Sambousek Box",
    size: "Signature",
    weight: "10 pieces",
    pieceCount: 10,
    customizable: false,
    tag: "Delicate frosted cheese pastries",
    price: 35,
    blurb: "10 pieces of frozen cheese-filled sambousek, in a gatefold heritage chest box in deep dark-green leatherette with gold-lined trays inside.",
    features: ["Gatefold chest box", "Magnetic closure", "Leatherette finish", "Gold-lined trays"],
    includes: ["Cheese Sambousek"],
  },
  {
    id: "box-frozen-mix",
    category: "Frozen Foods",
    available: true,
    name: "❄️ Frozen Mix Box",
    size: "Mixed",
    weight: "20 pieces",
    pieceCount: 20,
    customizable: true,
    tag: "Mix any combination — you choose the pieces",
    price: 69,
    blurb: "Pick any 20 pieces across kibbeh, meat sambousek, and cheese sambousek — your own mix, one box.",
    features: ["Mixed selection", "Ready to fry or bake", "Frozen for freshness", "Great for entertaining"],
    includes: [],
  },
];

/* Real product & packaging photography, cropped from the brand book you provided. */
const REAL_LOGO_IMG = "/images/real-logo.png";
// Same logo, background keyed out to transparent — used only as a subtle
// watermark over product photos, not for the header/branding logo, which
// still uses the original solid-background version.
const WATERMARK_LOGO_IMG = "/images/watermark-logo.png";
const BOX_SMALL_IMG = "/images/box-small.jpg";
const BOX_MEDIUM_IMG = "/images/box-medium.jpg";
const BOX_LARGE_IMG = "/images/box-large.jpg";
const FRUITBOX_SMALL_IMG = "/images/fruitbox-small.jpg";
const FRUITBOX_MEDIUM_IMG = "/images/fruitbox-medium.jpg";
const FRUITBOX_LARGE_IMG = "/images/fruitbox-large.jpg";
const PRODUCT_ONION_IMG = "/images/product-onion.jpg";

const PRODUCT_BELLPEPPER_GREEN_IMG = "/images/product-bellpepper-green.jpg";
const PRODUCT_BELLPEPPER_RED_IMG = "/images/product-bellpepper-red.jpg";
const PRODUCT_CUCUMBER_IMG = "/images/product-cucumber.jpg";
const PRODUCT_CHERRY_TOMATO_IMG = "/images/product-cherry-tomato.jpg";
const PRODUCT_TOMATO_IMG = "/images/product-tomato.jpg";
const PRODUCT_BELLPEPPER_YELLOW_IMG = "/images/product-bellpepper-yellow.jpg";
const PRODUCT_GARLIC_IMG = "/images/product-garlic.jpg";
const PRODUCT_YELLOW_ONION_IMG = "/images/product-yellow-onion.jpg";
const PRODUCT_POTATO_IMG = "/images/product-potato.jpg";
const PRODUCT_EGGPLANT_IMG = "/images/product-eggplant.jpg";
const PRODUCT_LETTUCE_IMG = "/images/product-lettuce.jpg";
const PRODUCT_ZUCCHINI_IMG = "/images/product-zucchini.jpg";
const PRODUCT_SPINACH_IMG = "/images/product-spinach.jpg";
const PRODUCT_PARSLEY_IMG = "/images/product-parsley.jpg";

const PRODUCT_DILL_IMG = "/images/product-dill.jpg";
const PRODUCT_CELERY_IMG = "/images/product-celery.jpg";
const PRODUCT_BASIL_IMG = "/images/product-basil.jpg";
const PRODUCT_SWISSCHARD_IMG = "/images/product-swisschard.jpg";
const PRODUCT_ROCKET_IMG = "/images/product-rocket.jpg";
const PRODUCT_WATERCRESS_IMG = "/images/product-watercress.jpg";
const PRODUCT_KALE_IMG = "/images/product-kale.jpg";
const PRODUCT_REDLEAFLETTUCE_IMG = "/images/product-redleaflettuce.jpg";

Object.assign(REAL_PHOTOS, {
  "red-onion": PRODUCT_ONION_IMG,
  "bell-pepper-green": PRODUCT_BELLPEPPER_GREEN_IMG,
  "bell-pepper-red": PRODUCT_BELLPEPPER_RED_IMG,
  "cucumber": PRODUCT_CUCUMBER_IMG,
  "cherry-tomato": PRODUCT_CHERRY_TOMATO_IMG,
  "tomato": PRODUCT_TOMATO_IMG,
  "bell-pepper-yellow": PRODUCT_BELLPEPPER_YELLOW_IMG,
  "garlic": PRODUCT_GARLIC_IMG,
  "yellow-onion": PRODUCT_YELLOW_ONION_IMG,
  "potato": PRODUCT_POTATO_IMG,
  "eggplant": PRODUCT_EGGPLANT_IMG,
  "lettuce-iceberg": PRODUCT_LETTUCE_IMG,
  "zucchini": PRODUCT_ZUCCHINI_IMG,
  "spinach": PRODUCT_SPINACH_IMG,
  "parsley": PRODUCT_PARSLEY_IMG,
  "dill": PRODUCT_DILL_IMG,
  "celery": PRODUCT_CELERY_IMG,
  "basil": PRODUCT_BASIL_IMG,
  "swiss-chard": PRODUCT_SWISSCHARD_IMG,
  "rocket-arugula": PRODUCT_ROCKET_IMG,
  "watercress": PRODUCT_WATERCRESS_IMG,
  "apple": "/images/product-apple.jpg",
  "banana": "/images/product-banana.jpg",
  "orange": "/images/product-orange.jpg",
  "grapes-red": "/images/product-grapes-red.jpg",
  "strawberry": "/images/product-strawberry.jpg",
  "mango": "/images/product-mango.jpg",
  "grapes-green": "/images/product-grapes-green.jpg",
  "kiwi": "/images/product-kiwi.jpg",
  "pineapple": "/images/product-pineapple.jpg",
  "pomegranate": "/images/product-pomegranate.jpg",
  "pear": "/images/product-pear.jpg",
  "honey-peach": "/images/product-honey-peach.jpg",
  "baby-corn": "/images/product-babycorn.jpg",
  "corn": "/images/product-corn.jpg",
  "celeriac": "/images/product-celeriac.jpg",
  "fennel": "/images/product-fennel-real.jpg",
  "leek": "/images/product-leek-real.jpg",
  "artichoke": "/images/product-artichoke.jpg",
  "asparagus": "/images/product-asparagus.jpg",
  "shiitake": "/images/product-shiitake.jpg",
  "oyster-mushroom": "/images/product-oyster-mushroom.jpg",
  "carrot": "/images/product-carrot.jpg",
  "lemon": "/images/product-lemon.jpg",
  "chili-pepper": "/images/product-chili-pepper.jpg",
  "sweet-potato": "/images/product-sweet-potato.jpg",
  "beetroot": "/images/product-beetroot.jpg",
  "white-onion": "/images/product-white-onion.jpg",
  "shallots": "/images/product-shallots.jpg",
  "fresh-garlic": "/images/product-fresh-garlic.jpg",
  "romaine-lettuce": "/images/product-romaine-lettuce.jpg",
  "green-leaf-lettuce": "/images/product-green-leaf-lettuce.jpg",
  "coriander-cilantro": "/images/product-coriander-cilantro.jpg",
  "mint": "/images/product-mint.jpg",
  "thyme": "/images/product-thyme.jpg",
  "rosemary": "/images/product-rosemary.jpg",
  "sage": "/images/product-sage.jpg",
  "oregano": "/images/product-oregano.jpg",
  "broccoli": "/images/product-broccoli.jpg",
  "cauliflower": "/images/product-cauliflower.jpg",
  "white-cabbage": "/images/product-white-cabbage.jpg",
  "red-cabbage": "/images/product-red-cabbage.jpg",
  "chinese-cabbage": "/images/product-chinese-cabbage.jpg",
  "brussels-sprouts": "/images/product-brussels-sprouts.jpg",
  "green-beans": "/images/product-green-beans.jpg",
  "french-beans": "/images/product-french-beans.jpg",
  "snow-peas": "/images/product-snow-peas.jpg",
  "sugar-snap-peas": "/images/product-sugar-snap-peas.jpg",
  "green-peas": "/images/product-green-peas.jpg",
  "broad-beans-fava": "/images/product-broad-beans-fava.jpg",
  "white-mushroom": "/images/product-white-mushroom.jpg",
  "brown-mushroom": "/images/product-brown-mushroom.jpg",
  "rhubarb-seasonal": "/images/product-rhubarb-seasonal.jpg",
  "molokhia": "/images/product-molokhia.jpg",
  "vine-leaves": "/images/product-vine-leaves.jpg",
  "purslane": "/images/product-purslane.jpg",
  "green-fava-beans": "/images/product-green-fava-beans.jpg",
  "fresh-broad-beans": "/images/product-fresh-broad-beans.jpg",
  "kousa-light-green-zucchini": "/images/product-kousa-light-green-zucchini.jpg",
  "green-almonds-seasonal": "/images/product-green-almonds-seasonal.jpg",
  "bell-pepper-orange": "/images/product-bell-pepper-orange.jpg",
  "green-chili": "/images/product-green-chili.jpg",
  "jalapeno": "/images/product-jalapeno.jpg",
  "baby-eggplant": "/images/product-baby-eggplant.jpg",
  "baby-potato": "/images/product-baby-potato.jpg",
  "mini-cucumber": "/images/product-mini-cucumber.jpg",
  "yellow-squash": "/images/product-yellow-squash.jpg",
  "pumpkin": "/images/product-pumpkin.jpg",
  "turnip": "/images/product-turnip.jpg",
  "parsnip": "/images/product-parsnip.jpg",
  "okra": "/images/product-okra.jpg",
  "red-radish": "/images/product-red-radish.jpg",
  "white-radish": "/images/product-white-radish.jpg",
  "portobello": "/images/product-portobello.jpg",
  "dragon-fruit": "/images/product-dragon-fruit.jpg",
  "mandarin": "/images/product-mandarin.jpg",
  "blueberries": "/images/product-blueberries.jpg",
  "3-colour-apples": "/images/product-3-colour-apples.jpg",
  "artisanal-spice-collection": "/images/gourmet-spice-collection.jpg",
  "sidr-honey-fig-preserves-set": "/images/gourmet-honey-fig-set.jpg",
  "honey-jar": "/images/gourmet-honey-fig-set.jpg",
  "zaatar-trio-box": "/images/gourmet-zaatar-trio.jpg",
  "premium-mixed-nuts-gift-box": "/images/gourmet-mixed-nuts.jpg",
  "premium-extra-virgin-olive-oil": "/images/gourmet-olive-oil.jpg",
  "kibbeh": "/images/box-kibbeh.jpg",
  "cherry": "/images/product-cherry.jpg",
  "flat-peach": "/images/product-flat-peach.jpg",
  "blackberry": "/images/product-blackberry.jpg",
  "raspberry": "/images/product-raspberry.jpg",
  "apricot": "/images/product-apricot.jpg",
  "kale": PRODUCT_KALE_IMG,
  "red-leaf-lettuce": PRODUCT_REDLEAFLETTUCE_IMG,
});

const HOTEL_CARTON_IMG = "/images/hotel-carton.jpg";


const POSTER_CHERRY_TOMATO_IMG = "/images/poster-cherry-tomato.jpg";
const POSTER_VAN_IMG = "/images/poster-van.jpg";
const POSTER_RED_PEPPER_IMG = "/images/poster-red-pepper.jpg";
const POSTER_CUCUMBER_IMG = "/images/poster-cucumber.jpg";
const AREAS = ["Downtown", "Marina", "Al Barsha", "Jumeirah", "Deira", "Mirdif", "Other"];
const TIME_SLOTS = ["8:00 – 10:00 AM", "10:00 AM – 12:00 PM", "2:00 – 4:00 PM", "5:00 – 7:00 PM", "7:00 – 9:00 PM"];
// End time of each slot in 24h form, used to grey out slots that have
// already passed if the customer has "today" selected as the delivery date.
const TIME_SLOT_END_HOUR = {
  "8:00 – 10:00 AM": 10,
  "10:00 AM – 12:00 PM": 12,
  "2:00 – 4:00 PM": 16,
  "5:00 – 7:00 PM": 19,
  "7:00 – 9:00 PM": 21,
};
// Local calendar date as YYYY-MM-DD — deliberately not toISOString(), which
// renders in UTC and would show the wrong date for several hours a day in
// Dubai (UTC+4), e.g. showing "yesterday" as the minimum bookable date.
function localDateISO(d = new Date()) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
const STATUS_STEPS = [
  { key: "placed", label: "Order Placed", icon: ClipboardList },
  { key: "preparing", label: "Preparing", icon: Package },
  { key: "out_for_delivery", label: "Out for Delivery", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle },
];

const AR_AREA = {
  "Downtown": "وسط المدينة", "Marina": "مارينا", "Al Barsha": "البرشاء",
  "Jumeirah": "جميرا", "Deira": "ديرة", "Mirdif": "مردف", "Other": "أخرى",
};
const AR_SLOT = {
  "8:00 – 10:00 AM": "٨:٠٠ – ١٠:٠٠ ص", "10:00 AM – 12:00 PM": "١٠:٠٠ ص – ١٢:٠٠ م",
  "2:00 – 4:00 PM": "٢:٠٠ – ٤:٠٠ م", "5:00 – 7:00 PM": "٥:٠٠ – ٧:٠٠ م", "7:00 – 9:00 PM": "٧:٠٠ – ٩:٠٠ م",
};
const AR_STATUS = {
  "Order Placed": "تم الطلب", "Preparing": "قيد التحضير",
  "Out for Delivery": "في الطريق إليك", "Delivered": "تم التوصيل",
};
function localArea(a, lang) { return lang === "ar" ? AR_AREA[a] || a : a; }
function localSlot(s, lang) { return lang === "ar" ? AR_SLOT[s] || s : s; }
function localStatus(s, lang) { return lang === "ar" ? AR_STATUS[s] || s : s; }

const ADMIN_PASSWORD = "Mo8122616";
// Real Firebase Authentication for Backstage — this is what actually lets
// Firestore security rules tell "this is genuinely the admin" apart from
// "this is any visitor," which the old plain-JavaScript password check
// could never do (Firestore has no way to see client-side code, only real
// auth sessions). Create this exact account once in Firebase Console →
// Authentication → Users → Add user, using this email and a real password,
// then update ADMIN_PASSWORD above to match whatever you set there.
const ADMIN_EMAIL = "backstage@darousha-fresh.local";
const DELIVERY_FEE = 25;
const LOYALTY_EARN_RATE = 0.02; // 2% of what's actually paid, back as points — 1 point = AED 1 when redeemed
const REVIEW_BONUS_POINTS = 10; // flat bonus for leaving a photo review, regardless of order size
async function awardReviewPoints(uid, bonusPoints) {
  try {
    const profile = await getProfile(uid);
    const newBalance = (profile?.loyaltyPoints || 0) + bonusPoints;
    await saveProfile(uid, { loyaltyPoints: newBalance });
    return true;
  } catch (e) {
    console.error("Award review points failed", e);
    return false;
  }
}
const VAT_RATE = 0.05; // UAE standard VAT, 5%
const WHATSAPP_NUMBER = "971524786729"; // 00 971 52 478 6729
const INSTAGRAM_URL = "https://www.instagram.com/darousha_fresh/";

// Your live Vercel domain — tracking links in WhatsApp/email messages point here.
const SITE_URL = "https://daroushafresh.com";
const CURRENT_VERSION = "20260806160419"; // must match public/version.json — bumped on every new build
function buildTrackingLink(orderId) {
  return `${SITE_URL}/?track=${orderId}`;
}
function buildInvoiceLink(orderId) {
  return `${SITE_URL}/?invoice=${orderId}`;
}
function buildDriveLink(orderId) {
  return `${SITE_URL}/?drive=${orderId}`;
}

/* ---- EmailJS config: fill these in from your EmailJS dashboard ----
   1. Create a free account at https://www.emailjs.com
   2. Add an Email Service (Gmail/Outlook/etc.) -> copy its Service ID
   3. Create an Email Template with variables: {{order_id}} {{items}}
      {{subtotal}} {{delivery_fee}} {{total}} {{customer_name}}
      {{customer_phone}} {{customer_address}} {{delivery_date}}
      {{delivery_slot}} {{payment_method}} {{track_link}} -> copy its Template ID
      Set the template's "To Email" field to {{to_email}} (recommended, so it
      always routes to BUSINESS_EMAIL below) or just hardcode your address.
   4. Account -> General -> copy your Public Key
   Paste all three below. Until then, order emails are silently skipped. */
const BUSINESS_EMAIL = "mohanad.daher@gmail.com";
const BUSINESS_TRN = "YOUR_TRN_NUMBER"; // UAE Tax Registration Number — required on a valid tax invoice if VAT-registered. Fill this in once registered with the FTA; search "BUSINESS_TRN" here to update it.
const BUSINESS_ADDRESS = "Dubai, United Arab Emirates"; // update with your real registered business address
const EMAILJS_SERVICE_ID = "service_b3wue7b";
const EMAILJS_TEMPLATE_ID = "template_94gnbwa";
const EMAILJS_PUBLIC_KEY = "l4sSzugaQ2yLl5KAY";
const EMAILJS_READY = !EMAILJS_SERVICE_ID.startsWith("YOUR_") && !EMAILJS_TEMPLATE_ID.startsWith("YOUR_") && !EMAILJS_PUBLIC_KEY.startsWith("YOUR_");
// A second, separate template for customer-facing status update emails
// (different wording/audience than the "new order" alert sent to you above).
// Needs its own template created in your EmailJS dashboard — the send
// function below stays a safe no-op until this is filled in, same as the
// business-alert template above.
const EMAILJS_STATUS_TEMPLATE_ID = "template_7cr7utn";
// Turned off for now — the "To Email" issue on this template still isn't
// fully confirmed working, and the plan is to revisit this once a real
// branded business email is set up. Everything else (template ID, service,
// key) stays configured below so this is a one-line flip back to true
// whenever you're ready to turn it back on — no need to redo any setup.
const EMAILJS_STATUS_ENABLED = false;
const EMAILJS_STATUS_READY = EMAILJS_STATUS_ENABLED && !EMAILJS_SERVICE_ID.startsWith("YOUR_") && !EMAILJS_STATUS_TEMPLATE_ID.startsWith("YOUR_") && !EMAILJS_PUBLIC_KEY.startsWith("YOUR_");

/* ---- Google Places config: enables much better building/address search
   at checkout than the free OpenStreetMap search. Setup (free tier, ~$200/mo
   credit from Google which comfortably covers a small business):
   1. console.cloud.google.com -> create or select a project
   2. APIs & Services -> Library -> enable "Places API" AND "Maps JavaScript API"
   3. APIs & Services -> Credentials -> Create Credentials -> API Key
   4. (Recommended) Restrict the key to your site's domain under "Application restrictions"
   Paste the key below. Until then, search falls back to the free OpenStreetMap
   search automatically. */
const GOOGLE_MAPS_API_KEY = "YOUR_GOOGLE_MAPS_API_KEY";
const GOOGLE_MAPS_READY = !GOOGLE_MAPS_API_KEY.startsWith("YOUR_");

const EMAILJS_SCRIPT_ID = "dsf-emailjs";
function useGoogleMaps() {
  const [ready, setReady] = useState(!!(typeof window !== "undefined" && window.google?.maps?.places));
  useEffect(() => {
    if (!GOOGLE_MAPS_READY || ready) return;
    if (document.getElementById("google-maps-script")) {
      const check = setInterval(() => {
        if (window.google?.maps?.places) {
          setReady(true);
          clearInterval(check);
        }
      }, 150);
      return () => clearInterval(check);
    }
    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.onload = () => setReady(true);
    document.head.appendChild(script);
  }, []);
  return ready;
}

function useLeaflet() {
  const [ready, setReady] = useState(!!(typeof window !== "undefined" && window.L));
  useEffect(() => {
    if (ready || document.getElementById("leaflet-script")) {
      const check = setInterval(() => {
        if (window.L) {
          setReady(true);
          clearInterval(check);
        }
      }, 150);
      return () => clearInterval(check);
    }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.id = "leaflet-script";
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setReady(true);
    document.head.appendChild(script);
  }, []);
  return ready;
}

function useVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  async function check() {
    try {
      const res = await fetch(`/version.json?t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      if (data.version && data.version !== CURRENT_VERSION) setUpdateAvailable(true);
    } catch {
      // offline or not deployed yet — ignore silently
    }
  }

  useEffect(() => {
    check();
    const interval = setInterval(check, 5 * 60 * 1000); // every 5 minutes
    function onVisible() {
      if (document.visibilityState === "visible") check();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return updateAvailable;
}

function useEmailJS() {
  useEffect(() => {
    if (!EMAILJS_READY || document.getElementById(EMAILJS_SCRIPT_ID)) return;
    const script = document.createElement("script");
    script.id = EMAILJS_SCRIPT_ID;
    script.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
    script.onload = () => {
      try {
        window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
      } catch (e) {
        console.error("EmailJS init failed", e);
      }
    };
    document.head.appendChild(script);
  }, []);
}
async function sendOrderNotificationEmail(order) {
  if (!EMAILJS_READY || !window.emailjs) return; // not configured yet — skip quietly
  try {
    await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_email: BUSINESS_EMAIL,
      order_id: order.id,
      items: order.items.map((it) => `${it.name}${it.breakdown && it.breakdown.length > 0 ? ` (${breakdownText(it, "en")})` : ""} x${it.qty} — ${money(it.qty * it.price)}`).join("\n"),
      subtotal: money(order.subtotal),
      delivery_fee: order.deliveryFee === 0 ? "Free" : money(order.deliveryFee),
      vat: money(order.vat || 0),
      total: money(order.total),
      customer_name: order.customer.name,
      customer_phone: order.customer.phone,
      customer_address: `${order.customer.address}, ${order.customer.area}`,
      delivery_date: order.customer.date,
      delivery_slot: order.customer.slot,
      payment_method: order.customer.payment === "cod" ? "Cash on delivery" : "Card",
      track_link: buildTrackingLink(order.id),
    });
  } catch (e) {
    console.error("Order notification email failed", e);
  }
}
function buildMailtoLink(order) {
  const subject = encodeURIComponent(`New order ${order.id} — Darousha Fresh`);
  const body = encodeURIComponent(buildOrderMessageText(order));
  return `mailto:${BUSINESS_EMAIL}?subject=${subject}&body=${body}`;
}

function buildOrderMessageText(order) {
  // Kept deliberately short: CallMeBot's free tier is known to silently fail
  // on long messages, especially ones packed with multiple full URLs. Directions
  // and Delivery Mode links are already one tap away in Backstage, so only the
  // single most essential link (Track) is included here.
  const itemsSummary = order.items.map((it) => `${it.name}${it.breakdown && it.breakdown.length > 0 ? ` (${breakdownText(it, "en")})` : ""} ×${it.qty}`).join(", ");
  return [
    `New order ${order.id} — Darousha Fresh`,
    itemsSummary,
    `Total: ${money(order.total)}`,
    `${order.customer.name} · ${order.customer.phone}`,
    `${order.customer.address}, ${order.customer.area}`,
    `${order.customer.date} · ${order.customer.slot} · ${order.customer.payment === "cod" ? "COD" : "Card"}`,
    ...(order.customer.leaveAtDoor ? ["📍 Leave at door"] : []),
    `Track: ${buildTrackingLink(order.id)}`,
  ].join("\n");
}
function buildWhatsAppLink(order) {
  const text = encodeURIComponent(buildOrderMessageText(order));
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}
function buildDirectionsLink(order) {
  const c = order.customer;
  // Uses the customer's exact GPS pin if they shared it at checkout; otherwise
  // falls back to their typed address. Waze is the standard driving-navigation
  // app in the UAE, so this opens turn-by-turn navigation directly in the
  // Waze app on a driver's phone (or the Waze website on desktop) — no API
  // key or billing required, same as the Google Maps link this replaces.
  if (c.lat && c.lng) {
    return `https://waze.com/ul?ll=${c.lat},${c.lng}&navigate=yes`;
  }
  const q = encodeURIComponent(`${c.address}, ${c.area}, Dubai, UAE`);
  return `https://waze.com/ul?q=${q}&navigate=yes`;
}
function phoneDigitsForWhatsApp(phone) {
  // Best-effort cleanup so a locally-entered number (e.g. "052 478 6729")
  // still resolves to a valid wa.me link with the UAE country code.
  let d = (phone || "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  else if (d.startsWith("0")) d = "971" + d.slice(1);
  return d;
}
const STATUS_CUSTOMER_MESSAGE = {
  placed: (o) => `Hi ${o.customer.name}, this is Darousha Fresh 🌿 We've received your order ${o.id} and it's confirmed!`,
  preparing: (o) => `Hi ${o.customer.name}, this is Darousha Fresh 🌿 Your order ${o.id} has been received by our driver and is being prepped now.`,
  out_for_delivery: (o) => `Hi ${o.customer.name}, this is Darousha Fresh 🌿 Your order ${o.id} is out for delivery and on its way to you!`,
  delivered: (o) => `Hi ${o.customer.name}, this is Darousha Fresh 🌿 Your order ${o.id} has just been delivered! We hope you enjoy it — thank you for ordering with us 💚`,
};
function buildStatusNotifyLink(order, status) {
  const digits = phoneDigitsForWhatsApp(order.customer.phone);
  const messageFn = STATUS_CUSTOMER_MESSAGE[status] || STATUS_CUSTOMER_MESSAGE.placed;
  const text = encodeURIComponent(messageFn(order));
  return `https://wa.me/${digits}?text=${text}`;
}
// Same one-tap wa.me pattern as buildStatusNotifyLink above, but for telling
// a customer their requested item is now in stock — the loop-closer that
// makes the whole "request an item" feature worth using.
function buildItemRequestNotifyLink(request) {
  const digits = phoneDigitsForWhatsApp(request.customerPhone);
  const name = request.customerName ? `Hi ${request.customerName}, ` : "Hi, ";
  const text = encodeURIComponent(
    `${name}this is Darousha Fresh 🌿 Good news — "${request.itemName}" is now available! Tap here to order: ${window.location.origin}`
  );
  return `https://wa.me/${digits}?text=${text}`;
}
// Automatic email to the CUSTOMER at each status change — separate from
// sendOrderNotificationEmail above, which alerts the business instead.
// Needs EMAILJS_STATUS_TEMPLATE_ID configured; stays a safe no-op until then.
// Also does nothing if the order somehow has no customer email on file
// (shouldn't happen since checkout requires sign-in, but cheap to guard).
async function sendOrderStatusEmail(order, status) {
  // Only the "delivered" stage gets an automatic email (with the receipt
  // link) — other stage changes are communicated via the "Notify customer"
  // WhatsApp button instead, not email.
  if (status !== "delivered") return;
  if (!EMAILJS_STATUS_READY || !window.emailjs || !order.customer.email) return;
  const statusLabel = (STATUS_STEPS.find((s) => s.key === status) || {}).label || status;
  try {
    await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_STATUS_TEMPLATE_ID, {
      to_email: order.customer.email,
      customer_name: order.customer.name,
      order_id: order.id,
      status_label: statusLabel,
      track_link: buildInvoiceLink(order.id), // the receipt, since tracking is no longer relevant once delivered
    });
  } catch (e) {
    console.error("Order status email failed", e);
  }
}

/* ---- CallMeBot config: sends YOU (the business) an automatic WhatsApp
   message the instant an order is placed — no backend, free, no popup
   on the customer's side. Setup:
   1. Save +34 611 01 16 37 as a contact in your own phone (check
      https://www.callmebot.com/blog/free-api-whatsapp-messages/ first —
      CallMeBot rotates this bot number occasionally, so confirm it's current)
   2. From the WhatsApp number you want alerts sent to (likely your
      971524786729 business number), message that contact exactly:
      "I allow callmebot to send me messages"
   3. Within ~2 minutes you'll get a reply with your API key — paste it below.
   Until CALLMEBOT_APIKEY is filled in, this is silently skipped. */
const CALLMEBOT_PHONE = WHATSAPP_NUMBER; // the number that opted in with CallMeBot
const CALLMEBOT_APIKEY = "8870812";
const CALLMEBOT_READY = !CALLMEBOT_APIKEY.startsWith("YOUR_");
function sendOrderNotificationWhatsApp(order) {
  if (!CALLMEBOT_READY) return; // not configured yet — skip quietly
  const text = encodeURIComponent(buildOrderMessageText(order));
  const url = `https://api.callmebot.com/whatsapp.php?phone=${CALLMEBOT_PHONE}&text=${text}&apikey=${CALLMEBOT_APIKEY}`;
  // Attach a real 1x1 <img> to the page rather than an unattached Image()
  // object or a background fetch(). CallMeBot isn't built with CORS support
  // for being called from inside a live web page, so requests that don't
  // resemble a real resource load in the DOM can get silently dropped even
  // though the browser reports no error.
  const pixel = document.createElement("img");
  pixel.src = url;
  pixel.width = 1;
  pixel.height = 1;
  pixel.style.position = "absolute";
  pixel.style.left = "-9999px";
  pixel.alt = "";
  const cleanup = () => pixel.remove();
  pixel.onload = cleanup;
  pixel.onerror = cleanup;
  document.body.appendChild(pixel);
  setTimeout(cleanup, 15000); // safety net in case neither event fires
}

const LOW_STOCK_THRESHOLD = 10; // send an alert (and show the Backstage banner) once stock is at or below this
function sendLowStockAlertWhatsApp(lowStockItems) {
  if (!CALLMEBOT_READY || lowStockItems.length === 0) return;
  const list = lowStockItems.map((p) => `${p.name} (${p.stock} left)`).join(", ");
  const text = encodeURIComponent(`⚠️ Darousha Fresh — low stock alert: ${list}. Time to restock!`);
  const url = `https://api.callmebot.com/whatsapp.php?phone=${CALLMEBOT_PHONE}&text=${text}&apikey=${CALLMEBOT_APIKEY}`;
  const pixel = document.createElement("img");
  pixel.src = url;
  pixel.width = 1;
  pixel.height = 1;
  pixel.style.position = "absolute";
  pixel.style.left = "-9999px";
  pixel.alt = "";
  const cleanup = () => pixel.remove();
  pixel.onload = cleanup;
  pixel.onerror = cleanup;
  document.body.appendChild(pixel);
  setTimeout(cleanup, 15000);
}

const FREE_DELIVERY_OVER = 100; // free delivery on orders above this subtotal

/* Promo codes — add/remove codes here. type: "percent" (value = % off
   subtotal) or "fixed" (value = flat AED off subtotal, never below 0). */
const PROMO_CODES = {
  WELCOME10: { type: "percent", value: 10, label: "10% off your first order" },
  FRESH20: { type: "fixed", value: 20, label: "AED 20 off" },
};
const REFERRAL_DISCOUNT = 15; // AED off for a friend's first order when they use a referral code
// Fixed-price fruit boxes (Wooden Crate, Luxury Box, Signature Gift Box) let
// customers fill the box with any mix of fruit for one flat price — without
// a cap, someone could fill the whole box with the priciest fruit for the
// same price as a box of cheap ones. This limits specific expensive fruits
// to a max quantity per box, regardless of how many total pieces it holds.
const FRUIT_BOX_MAX_PER_BOX = {
  "Pineapple": 1,
  "Mango": 1,
  "Dragon Fruit": 1,
  "Grapes (Red)": 1,
  "Grapes (Green)": 1,
  "Strawberry": 1,
  "Blueberries": 1,
};
// Small, inexpensive fruits are worth much less per piece than something
// like a whole pineapple — letting a customer fill the box one banana at a
// time treats them as equal value, which they're not. These increase in a
// minimum set of 3 per tap instead of 1, so the box mix stays fair. Fruits
// not listed here (and anything in FRUIT_BOX_MAX_PER_BOX above) just use
// the default step of 1.
const FRUIT_BOX_STEP = {
  "Apple": 3,
  "Banana": 3,
  "Orange": 3,
  "Kiwi": 3,
  "Mandarin": 3,
  "Pear": 3,
  "Pomegranate": 3,
  "Honey Peach": 3,
};
// Vegetable boxes (Daily/Family/Signature/Chef's) work the same pick-your-
// own way as the fruit boxes, but there are far too many vegetables to
// hand-list a cap/step for each one the way fruits are above. Instead of
// guessing from price (which broke the moment any item's price changed —
// Bell Pepper at 33 AED after a Backstage edit got capped at 1 per box
// even though it should never have been limited), this caps only what's
// genuinely sold as one whole unit: anything with unit "bunch" (parsley,
// garlic...), plus the entire Leafy Greens category, since a head of
// lettuce or a bunch of spinach is the same "pick 1" situation even
// though a couple of lettuce varieties happen to be catalogued as
// "piece" rather than "bunch". Everything else — kg-priced staples like
// tomato/cucumber/bell pepper, or piece-priced items outside Leafy
// Greens — has no cap here at all; only the box's total slot count and
// actual stock limit how many a customer can pick.
function boxItemMaxPerBox(product) {
  if (typeof FRUIT_BOX_MAX_PER_BOX[product.name] === "number") return FRUIT_BOX_MAX_PER_BOX[product.name];
  if (product.category === "Leafy Greens") return 1;
  if (product.category !== "Fruits" && product.unit === "bunch") return 1;
  return null;
}
// Same price-based guessing problem as the old max-per-box rule: this used
// to force any vegetable under 5 AED into sets of 3 (potato, carrot,
// onion...), so a customer picking a mixed veg box couldn't add just one
// potato — only groups of 3. Fruits keep their own deliberate step list
// above; every vegetable now defaults to picking one at a time.
function boxItemStep(product) {
  if (typeof FRUIT_BOX_STEP[product.name] === "number") return FRUIT_BOX_STEP[product.name];
  return 1;
}
function referralCodeFor(uid, name) {
  const namePart = (name || "FRESH").replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 6) || "FRESH";
  const uidPart = (uid || "0000").slice(0, 4).toUpperCase();
  return namePart + uidPart;
}

/* ------------------------------------ Helpers ------------------------------------ */

function money(n) {
  return `AED ${n.toFixed(2)}`;
}

function genOrderId() {
  // Timestamp-based, not just a random 6-digit number out of 900,000
  // possibilities — the old version had a real (if rare) chance of two
  // orders landing on the same ID and one silently overwriting the other
  // in the database, since orders are saved with a plain setDoc keyed on
  // this ID. Two orders would now need to be placed in the exact same
  // millisecond to collide, which is effectively impossible here.
  return "DF" + Date.now().toString(36).toUpperCase();
}

/* Firestore-backed storage: replaces the earlier localStorage fallback so
   orders/prices/leads are shared across every device (customers' phones,
   your Backstage, anywhere) instead of being stuck in one browser. Note:
   this is a one-time fetch on page load, not a live subscription — if
   someone places an order while Backstage is already open, reload the
   Backstage page to see it. */
const firebaseConfig = {
  apiKey: "AIzaSyC6Dpl6rJZQf9fYAIuogpWzS1GOcQse8PA",
  authDomain: "darousha-fresh.firebaseapp.com",
  projectId: "darousha-fresh",
  storageBucket: "darousha-fresh.firebasestorage.app",
  messagingSenderId: "825029194068",
  appId: "1:825029194068:web:fb06180ffbb47a39b318c1",
};
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);
const storage = getStorage(firebaseApp);

/* Uploads a photo file to Firebase Storage under product-photos/ and
   resolves with its public download URL. Requires Storage security rules
   that allow writes to that path — Backstage isn't wired to Firebase Auth
   (it's just a shared password), so rules must allow unauthenticated
   writes there, e.g.:
     match /product-photos/{allPaths=**} { allow read, write: if true; }
   Tightening this later (e.g. to a fixed set of admin UIDs) is worth doing
   once real staff accounts exist. */
/* Uploads a photo file to Firebase Storage under product-photos/ and
   resolves with its public download URL. Requires Storage security rules
   that allow writes to that path — Backstage isn't wired to Firebase Auth
   (it's just a shared password), so rules must allow unauthenticated
   writes there, e.g.:
     match /product-photos/{allPaths=**} { allow read, write: if true; }
   Tightening this later (e.g. to a fixed set of admin UIDs) is worth doing
   once real staff accounts exist.
   A 25s timeout turns a silent hang (e.g. Storage never enabled for this
   Firebase project, or a network/CORS block that never fires Firebase's
   own error callback) into a visible, actionable error instead of an
   upload bar stuck at 0% forever. */
function uploadProductPhoto(file, productId, onProgress) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error("timeout: no response from Firebase Storage after 25s — Storage may not be enabled for this project, or the request is being blocked before it reaches Firebase."));
    }, 25000);

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `product-photos/${productId}-${Date.now()}.${ext}`;
    console.log("[photo upload] starting", { path, size: file.size, type: file.type });

    let task;
    try {
      task = uploadBytesResumable(storageRef(storage, path), file);
    } catch (err) {
      clearTimeout(timeoutId);
      settled = true;
      console.error("[photo upload] failed to start", err);
      reject(err);
      return;
    }

    task.on(
      "state_changed",
      (snap) => {
        console.log("[photo upload] progress", snap.bytesTransferred, "/", snap.totalBytes, snap.state);
        onProgress && onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
      },
      (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        console.error("[photo upload] error callback", err.code, err.message, err);
        reject(err);
      },
      async () => {
        if (settled) return;
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          if (settled) return;
          settled = true;
          clearTimeout(timeoutId);
          console.log("[photo upload] complete", url);
          resolve(url);
        } catch (err) {
          if (settled) return;
          settled = true;
          clearTimeout(timeoutId);
          console.error("[photo upload] getDownloadURL failed", err);
          reject(err);
        }
      }
    );
  });
}

function uploadReviewPhoto(file, reviewId, onProgress) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error("timeout: no response from Firebase Storage after 25s"));
    }, 25000);
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `review-photos/${reviewId}-${Date.now()}.${ext}`;
    let task;
    try {
      task = uploadBytesResumable(storageRef(storage, path), file);
    } catch (err) {
      clearTimeout(timeoutId);
      settled = true;
      reject(err);
      return;
    }
    task.on(
      "state_changed",
      (snap) => onProgress && onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        reject(err);
      },
      async () => {
        if (settled) return;
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          if (settled) return;
          settled = true;
          clearTimeout(timeoutId);
          resolve(url);
        } catch (err) {
          if (settled) return;
          settled = true;
          clearTimeout(timeoutId);
          reject(err);
        }
      }
    );
  });
}
async function submitReview(review) {
  try {
    await setDoc(doc(db, "reviews", review.id), review);
    return true;
  } catch (e) {
    console.error("Review submit failed", e);
    return false;
  }
}
function subscribeToReviews(onUpdate) {
  try {
    return onSnapshot(collection(db, "reviews"), (snap) => {
      onUpdate(snap.docs.map((d) => d.data()));
    });
  } catch (e) {
    console.error("Reviews subscription failed", e);
    return () => {};
  }
}
async function setReviewApproved(id, approved) {
  try {
    await setDoc(doc(db, "reviews", id), { approved }, { merge: true });
    return true;
  } catch (e) {
    console.error("Review approval update failed", e);
    return false;
  }
}
async function deleteReviewDoc(id) {
  try {
    await deleteDoc(doc(db, "reviews", id));
    return true;
  } catch (e) {
    console.error("Review delete failed", e);
    return false;
  }
}
async function getProfile(uid) {
  try {
    const snap = await getDoc(doc(db, "profiles", uid));
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.error("Firestore profile get failed:", e);
    return null;
  }
}
async function saveProfile(uid, data) {
  try {
    await setDoc(doc(db, "profiles", uid), data, { merge: true });
  } catch (e) {
    console.error("Firestore profile save failed:", e);
  }
}

/* Orders and leads each live as their OWN document in their own collection
   (doc id = order.id / lead.id), instead of one shared array in a single
   document. This is the important fix: with a shared array, any single
   save/update overwrites the *entire* list using whatever was loaded into
   that particular browser at the time — so two people using the app around
   the same time could silently erase each other's orders. One document per
   order means placing or updating an order can never touch any other. */
async function fetchAllOrders() {
  try {
    const snap = await getDocs(collection(db, "orders"));
    return snap.docs.map((d) => d.data());
  } catch (e) {
    console.error("Firestore orders fetch failed:", e);
    return [];
  }
}
function subscribeToAllOrders(onUpdate) {
  // Live collection listener instead of a one-time fetch — this is what
  // makes new orders (and status changes) show up instantly in Backstage
  // without needing WhatsApp at all, and without needing a page refresh.
  try {
    return onSnapshot(collection(db, "orders"), (snap) => {
      onUpdate(snap.docs.map((d) => d.data()));
    });
  } catch (e) {
    console.error("Firestore orders subscription failed:", e);
    return () => {};
  }
}
async function saveOrderDoc(order) {
  try {
    await setDoc(doc(db, "orders", order.id), order);
    return true;
  } catch (e) {
    console.error("Firestore order save failed:", e);
    return false;
  }
}
async function saveSubscriptionDoc(sub) {
  try {
    await setDoc(doc(db, "subscriptions", sub.id), sub);
    return true;
  } catch (e) {
    console.error("Firestore subscription save failed:", e);
    return false;
  }
}
async function updateSubscriptionDoc(id, patch) {
  try {
    await setDoc(doc(db, "subscriptions", id), patch, { merge: true });
    return true;
  } catch (e) {
    console.error("Firestore subscription update failed:", e);
    return false;
  }
}
async function fetchAllSubscriptions() {
  try {
    const snap = await getDocs(collection(db, "subscriptions"));
    return snap.docs.map((d) => d.data());
  } catch (e) {
    console.error("Firestore subscriptions fetch failed:", e);
    return [];
  }
}
function subscribeToUserSubscriptions(uid, onUpdate) {
  try {
    return onSnapshot(collection(db, "subscriptions"), (snap) => {
      onUpdate(snap.docs.map((d) => d.data()).filter((s) => s.uid === uid));
    });
  } catch (e) {
    console.error("Firestore user subscriptions listener failed:", e);
    return () => {};
  }
}
// Weekly = every 7 days, biweekly = every 14, monthly = same day-of-month
// next cycle. Kept as a plain date-math helper so both the checkout screen
// (showing "next delivery: ...") and the auto-order-creation logic agree
// on exactly the same calculation.
function nextSubscriptionDate(fromDate, frequency) {
  const d = new Date(fromDate);
  if (frequency === "monthly") {
    d.setMonth(d.getMonth() + 1);
  } else {
    d.setDate(d.getDate() + (frequency === "biweekly" ? 14 : 7));
  }
  return d;
}
async function updateOrderStatusDoc(id, status) {
  try {
    // setDoc+merge instead of updateDoc: if this order's document doesn't
    // exist yet for any reason, this creates it instead of throwing —
    // updateDoc would silently fail on a missing document.
    await setDoc(doc(db, "orders", id), { id, status }, { merge: true });
    return true;
  } catch (e) {
    console.error("Firestore order status update failed:", e);
    return false;
  }
}
async function acknowledgeOrderDoc(id) {
  try {
    // Written to Firestore (not just local state) so pressing "Receive" on
    // one iPad silences the ring on every other device running Backstage.
    await setDoc(doc(db, "orders", id), { id, acknowledgedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (e) {
    console.error("Firestore order acknowledge failed:", e);
    return false;
  }
}
async function updateDriverLocation(id, lat, lng) {
  try {
    await setDoc(doc(db, "orders", id), { id, driverLat: lat, driverLng: lng, driverUpdatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (e) {
    console.error("Firestore driver location update failed:", e);
    return false;
  }
}
function subscribeToOrder(id, onUpdate) {
  // Live listener so a customer's tracking page updates in real time as the
  // driver moves or the status changes — no need to refresh.
  try {
    return onSnapshot(doc(db, "orders", id), (snap) => {
      if (snap.exists()) onUpdate(snap.data());
    });
  } catch (e) {
    console.error("Firestore order subscription failed:", e);
    return () => {};
  }
}
async function fetchAllLeads() {
  try {
    const snap = await getDocs(collection(db, "leads"));
    return snap.docs.map((d) => d.data());
  } catch (e) {
    console.error("Firestore leads fetch failed:", e);
    return [];
  }
}
async function fetchAllProfiles() {
  try {
    const snap = await getDocs(collection(db, "profiles"));
    return snap.docs.map((d) => ({ uid: d.id, ...d.data() })); // uid is the doc ID, not a stored field
  } catch (e) {
    console.error("Firestore profiles fetch failed:", e);
    return [];
  }
}
async function saveLeadDoc(lead) {
  try {
    await setDoc(doc(db, "leads", lead.id), lead);
  } catch (e) {
    console.error("Firestore lead save failed:", e);
  }
}

/* Item requests — "Can't find it? Request it" feature. Same one-document-
   per-request pattern as orders/leads, kept in its own collection so it
   never fights other writes. status is "pending" | "sourcing" | "added" |
   "declined", set by Backstage. */
async function fetchAllItemRequests() {
  try {
    const snap = await getDocs(collection(db, "itemRequests"));
    return snap.docs.map((d) => d.data());
  } catch (e) {
    console.error("Firestore item requests fetch failed:", e);
    return [];
  }
}
function subscribeToItemRequests(onUpdate) {
  try {
    return onSnapshot(collection(db, "itemRequests"), (snap) => {
      onUpdate(snap.docs.map((d) => d.data()));
    });
  } catch (e) {
    console.error("Firestore item requests subscription failed:", e);
    return () => {};
  }
}
async function saveItemRequestDoc(request) {
  try {
    await setDoc(doc(db, "itemRequests", request.id), request);
    return true;
  } catch (e) {
    console.error("Firestore item request save failed:", e);
    return false;
  }
}
async function updateItemRequestStatusDoc(id, status) {
  try {
    await setDoc(doc(db, "itemRequests", id), { id, status }, { merge: true });
    return true;
  } catch (e) {
    console.error("Firestore item request status update failed:", e);
    return false;
  }
}
function sendItemRequestAlertWhatsApp(request) {
  if (!CALLMEBOT_READY) return; // not configured yet — skip quietly
  const text = encodeURIComponent(
    `🙋 Darousha Fresh — item request: "${request.itemName}"${request.quantity ? ` (${request.quantity})` : ""} from ${request.customerName || "a customer"}${request.customerPhone ? ` (${request.customerPhone})` : ""}.${request.note ? ` Note: ${request.note}` : ""}`
  );
  const url = `https://api.callmebot.com/whatsapp.php?phone=${CALLMEBOT_PHONE}&text=${text}&apikey=${CALLMEBOT_APIKEY}`;
  const pixel = document.createElement("img");
  pixel.src = url;
  pixel.width = 1;
  pixel.height = 1;
  pixel.style.position = "absolute";
  pixel.style.left = "-9999px";
  pixel.alt = "";
  const cleanup = () => pixel.remove();
  pixel.onload = cleanup;
  pixel.onerror = cleanup;
  document.body.appendChild(pixel);
  setTimeout(cleanup, 15000);
}

// Starting-point tiers from the Office Friday Box pricing discussion —
// intentionally a suggestion sent to the business owner, not a price
// quoted to the company automatically. B2B pricing like this usually
// still wants a human look before it goes out, so this speeds up that
// human step instead of skipping it.
function suggestedOfficeBoxWeeklyPrice(headcount) {
  const n = Number(headcount) || 0;
  if (n <= 0) return null;
  if (n <= 10) return "~180 AED/week (Small Office tier)";
  if (n <= 25) return "~400 AED/week (Medium Office tier)";
  if (n <= 50) return "~750 AED/week (Large Office tier)";
  return "Custom quote needed (Enterprise, 50+)";
}

function sendOfficeLeadAlertWhatsApp(lead) {
  if (!CALLMEBOT_READY) return; // not configured yet — skip quietly
  const suggested = suggestedOfficeBoxWeeklyPrice(lead.headcount);
  const text = encodeURIComponent(
    `🏢 Office Friday Box request — ${lead.company}, ~${lead.headcount || "?"} employees. Contact: ${lead.contact} (${lead.phone}). ${lead.message || ""}${suggested ? `\n\n💰 Suggested price: ${suggested}` : ""}`
  );
  const url = `https://api.callmebot.com/whatsapp.php?phone=${CALLMEBOT_PHONE}&text=${text}&apikey=${CALLMEBOT_APIKEY}`;
  const pixel = document.createElement("img");
  pixel.src = url;
  pixel.width = 1;
  pixel.height = 1;
  pixel.style.position = "absolute";
  pixel.style.left = "-9999px";
  pixel.alt = "";
  const cleanup = () => pixel.remove();
  pixel.onload = cleanup;
  pixel.onerror = cleanup;
  document.body.appendChild(pixel);
  setTimeout(cleanup, 15000);
}

async function storageGet(key) {
  try {
    const snap = await getDoc(doc(db, "app-state", key));
    return snap.exists() ? snap.data().value : null;
  } catch (e) {
    console.error("Firestore get failed:", key, e);
    return null;
  }
}
async function storageSet(key, value) {
  try {
    await setDoc(doc(db, "app-state", key), { value });
    return true;
  } catch (e) {
    console.error("Firestore set failed:", key, e);
    return false;
  }
}
// Live document listener instead of a one-time fetch — this is what makes
// a price/stock/availability change made in Backstage show up instantly
// on every already-open customer tab and every other Backstage device,
// with no page refresh needed at all (matches how orders already sync).
function storageSubscribe(key, onUpdate) {
  try {
    return onSnapshot(doc(db, "app-state", key), (snap) => {
      onUpdate(snap.exists() ? snap.data().value : null);
    });
  } catch (e) {
    console.error("Firestore subscription failed:", key, e);
    return () => {};
  }
}

/* ------------------------------------ Small UI atoms ------------------------------------ */

function PriceTag({ value, unit, size = "md", originalValue }) {
  const { lang } = useLang();
  const big = size === "lg";
  const onSale = typeof originalValue === "number" && originalValue > value;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      {onSale && (
        <span style={{ fontSize: big ? 10.5 : 9.5, fontWeight: 800, letterSpacing: "0.05em", color: "#fff", background: BRAND.tomato, borderRadius: 999, padding: big ? "3px 9px" : "2px 7px", textTransform: lang === "ar" ? "none" : "uppercase" }}>
          {lang === "ar" ? "خصم" : "Sale"}
        </span>
      )}
      <div style={{ display: "inline-flex", alignItems: "baseline", gap: 6 }}>
        {onSale && (
          <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: big ? 13 : 11, color: BRAND.ink, opacity: 0.45, textDecoration: "line-through" }}>
            {money(originalValue)}
          </span>
        )}
        <div
          style={{
            display: "inline-flex",
            alignItems: "baseline",
            gap: 4,
            background: onSale ? "#FDEAEA" : BRAND.cream,
            border: `1.5px dashed ${onSale ? BRAND.tomato : BRAND.orange}`,
            borderRadius: 8,
            padding: big ? "6px 12px" : "3px 8px",
            transform: "rotate(-1.5deg)",
            fontFamily: "IBM Plex Mono, monospace",
            color: onSale ? BRAND.tomato : BRAND.orangeDeep,
            fontWeight: 600,
            fontSize: big ? 18 : 13,
            whiteSpace: "nowrap",
          }}
        >
          {money(value)}
          {unit ? <span style={{ fontSize: big ? 11 : 10, color: BRAND.ink, opacity: 0.6 }}>/{unit}</span> : null}
        </div>
      </div>
    </div>
  );
}

function Stepper({ qty, onChange, disabled, max }) {
  const atMax = typeof max === "number" && qty >= max;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, border: `1.5px solid ${BRAND.green}`, borderRadius: 999, overflow: "hidden", opacity: disabled ? 0.4 : 1 }}>
      <button
        disabled={disabled}
        onClick={() => onChange(Math.max(0, qty - 1))}
        style={btnIconStyle}
        aria-label="Decrease quantity"
      >
        <Minus size={14} />
      </button>
      <div style={{ minWidth: 26, textAlign: "center", fontFamily: "IBM Plex Mono, monospace", fontWeight: 600, fontSize: 14 }}>{qty}</div>
      <button
        disabled={disabled || atMax}
        onClick={() => onChange(Math.min(typeof max === "number" ? max : Infinity, qty + 1))}
        style={{ ...btnIconStyle, opacity: atMax ? 0.35 : 1, cursor: atMax ? "default" : "pointer" }}
        aria-label="Increase quantity"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
const btnIconStyle = {
  background: BRAND.cream,
  border: "none",
  padding: "6px 9px",
  color: BRAND.green,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
};

function Pill({ children, active, onClick, disabled }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        border: `1.5px solid ${active ? BRAND.green : BRAND.creamDeep}`,
        background: active ? BRAND.green : "#fff",
        color: active ? "#fff" : BRAND.ink,
        borderRadius: 999,
        padding: "8px 16px",
        fontFamily: "Manrope, sans-serif",
        fontWeight: 600,
        fontSize: 13.5,
        cursor: disabled ? "default" : "pointer",
        whiteSpace: "nowrap",
        opacity: disabled ? 0.4 : 1,
        transition: "all .15s ease",
      }}
    >
      {children}
    </button>
  );
}

function PrimaryButton({ children, onClick, disabled, style, full }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? "#C9C2B2" : BRAND.green,
        color: "#fff",
        border: "none",
        borderRadius: 8,
        padding: "13px 22px",
        fontFamily: "Manrope, sans-serif",
        fontWeight: 700,
        fontSize: 15,
        cursor: disabled ? "not-allowed" : "pointer",
        width: full ? "100%" : "auto",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        boxShadow: disabled ? "none" : "0 6px 16px rgba(18,56,34,0.28)",
        transition: "transform .12s ease, background .2s ease",
        ...style,
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {children}
    </button>
  );
}

function GhostButton({ children, onClick, style }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "transparent",
        border: `1.5px solid ${BRAND.orange}`,
        color: BRAND.green,
        borderRadius: 8,
        padding: "11px 18px",
        fontFamily: "Manrope, sans-serif",
        fontWeight: 700,
        fontSize: 14.5,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/* ============================================================================
   MAIN APP
============================================================================ */

function AppShell() {
  useBrandFonts();
  useResponsiveStyles();
  useEmailJS();
  const updateAvailable = useVersionCheck();
  const { lang, dir, t } = useLang();

  function getTrackParam() {
    try {
      return new URLSearchParams(window.location.search).get("track");
    } catch {
      return null;
    }
  }
  function getDriveParam() {
    try {
      return new URLSearchParams(window.location.search).get("drive");
    } catch {
      return null;
    }
  }
  function getInvoiceParam() {
    try {
      return new URLSearchParams(window.location.search).get("invoice");
    } catch {
      return null;
    }
  }
  function getRecipeParam() {
    try {
      return new URLSearchParams(window.location.search).get("recipe");
    } catch {
      return null;
    }
  }

  const [view, setView] = useState(() => (getInvoiceParam() ? "invoice" : getDriveParam() ? "drive" : getTrackParam() ? "track" : getRecipeParam() ? "recipes" : "home"));
  // Makes the browser's own Back button work for in-app navigation. Without
  // this, every setView() call only changes React state — the URL and
  // history never move, so there's nothing for Back to go back to, and the
  // only way to leave a page was reloading the whole site from scratch.
  // isPoppingRef distinguishes "the browser fired popstate" from "the app
  // called setView normally" so the two effects below don't fight each
  // other and double-push or get stuck.
  const isPoppingRef = useRef(false);
  const historyMountedRef = useRef(false);
  useEffect(() => {
    if (isPoppingRef.current) {
      isPoppingRef.current = false;
      return;
    }
    if (!historyMountedRef.current) {
      historyMountedRef.current = true;
      window.history.replaceState({ view }, "");
      return;
    }
    window.history.pushState({ view }, "");
  }, [view]);
  useEffect(() => {
    function onPopState(e) {
      isPoppingRef.current = true;
      setView((e.state && e.state.view) || "home");
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const [deepLinkOrderId] = useState(getTrackParam); // set once on load; doesn't change
  const [driveOrderId] = useState(getDriveParam); // set once on load; doesn't change
  const [deepLinkRecipeId] = useState(getRecipeParam); // set once on load; doesn't change
  const [invoiceOrderId] = useState(getInvoiceParam); // set once on load; doesn't change
  const [manualTrackId, setManualTrackId] = useState(null); // set when a customer taps "Track" on an order in their history
  const [products, setProducts] = useState(PRODUCTS);
  const [customProducts, setCustomProducts] = useState([]); // products added live from Backstage, not baked into the code
  // What every customer-facing view actually shops from — the built-in
  // catalog plus anything added live from Backstage. Kept as two separate
  // pieces of state (rather than merging into one) so Backstage's existing
  // price/stock editing for the built-in catalog stays completely
  // unchanged, while custom products get their own simple add/edit/delete.
  const allProducts = useMemo(() => [...products, ...customProducts], [products, customProducts]);
  const [boxes, setBoxes] = useState(BOXES);
  const [promoCodesDb, setPromoCodesDb] = useState(PROMO_CODES);
  const [suppliers, setSuppliers] = useState([]); // [{ id, name, phone }] — registered suppliers to send reorder lists to
  const [cart, setCart] = useState(() => {
    // Cart survives page reloads (including the auto-update reload below) —
    // without this, refreshing to get a new version would silently wipe
    // out anything sitting in someone's cart.
    try {
      const saved = localStorage.getItem("dsf-cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }); // {id,name,unit,price,qty,kind:'item'|'box'}
  useEffect(() => {
    try {
      localStorage.setItem("dsf-cart", JSON.stringify(cart));
    } catch {
      // storage full or unavailable — cart still works for this session, just won't survive a reload
    }
  }, [cart]);
  // Auto-refresh on a new deploy instead of waiting for someone to notice
  // and tap the banner's manual button. Safe to do silently now that cart
  // survives reloads (see above) — the one place we hold off is checkout,
  // since reloading mid-way through typing an address/phone number would
  // lose that (unsaved) form input even though the cart itself is fine.
  useEffect(() => {
    if (updateAvailable && view !== "checkout") {
      // A plain reload() can still be served from a mobile browser's local
      // cache in some cases. Navigating to a fresh, uniquely-querystringed
      // URL forces a genuine network fetch instead of reusing anything
      // cached — paired with the no-cache headers in vercel.json, this is
      // what actually makes the auto-update reliable on phones.
      const url = new URL(window.location.href);
      url.searchParams.set("_v", Date.now().toString());
      window.location.replace(url.toString());
    }
  }, [updateAvailable, view]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [orders, setOrders] = useState([]);
  const [leads, setLeads] = useState([]);
  const [itemRequests, setItemRequests] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [lastOrderId, setLastOrderId] = useState(null);
  const [lastOrder, setLastOrder] = useState(null);
  const [adminAuthed, setAdminAuthed] = useState(false);
  useEffect(() => {
    if (adminAuthed) {
      processDueSubscriptions(); // fire-and-forget — only the admin session should write to other customers' subscriptions/orders
      checkLowStockAndAlert(); // fire-and-forget — same reasoning: a business alert shouldn't depend on a customer's device
    }
  }, [adminAuthed]); // eslint-disable-line react-hooks/exhaustive-deps
  const [loaded, setLoaded] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // watch sign-in state; load the customer's saved profile when they're logged in
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const p = await getProfile(u.uid);
        setProfile(p);
      } else {
        setProfile(null);
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  // Catalog, box, and promo-code data now stays live-synced for the whole
  // session (not just fetched once on load) — a price or availability
  // change made in Backstage appears on every open customer tab within
  // moments, with no refresh needed, the same way new orders already do.
  useEffect(() => {
    let unsubOrders = () => {};
    let unsubReviews = () => {};
    let unsubItemRequests = () => {};
    const unsubCatalog = storageSubscribe("dsf-catalog-overrides", (overrides) => {
      if (!overrides) return;
      setProducts((prev) => prev.map((p) => (overrides[p.id] ? { ...p, ...overrides[p.id] } : p)));
    });
    const unsubBoxes = storageSubscribe("dsf-box-overrides", (boxOverrides) => {
      if (!boxOverrides) return;
      setBoxes((prev) => prev.map((b) => (boxOverrides[b.id] ? { ...b, ...boxOverrides[b.id] } : b)));
    });
    const unsubPromoCodes = storageSubscribe("dsf-promo-codes", (savedPromoCodes) => {
      if (savedPromoCodes) setPromoCodesDb(savedPromoCodes);
    });
    const unsubSuppliers = storageSubscribe("dsf-suppliers", (savedSuppliers) => {
      setSuppliers(Array.isArray(savedSuppliers) ? savedSuppliers : []);
    });
    const unsubCustomProducts = storageSubscribe("dsf-custom-products", (savedCustomProducts) => {
      const list = Array.isArray(savedCustomProducts) ? savedCustomProducts : [];
      // prodName() looks up PRODUCT_NAME_AR by English name — rather than
      // rewire every one of its call sites to accept a whole product object,
      // it's simpler and just as reliable to add each custom product's
      // Arabic name into that same lookup table as it loads.
      list.forEach((p) => { if (p.nameAr) PRODUCT_NAME_AR[p.name] = p.nameAr; });
      setCustomProducts(list);
    });
    (async () => {
      unsubOrders = subscribeToAllOrders((liveOrders) => {
        liveOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(liveOrders);
      });
      unsubReviews = subscribeToReviews((liveReviews) => {
        liveReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setReviews(liveReviews);
      });
      unsubItemRequests = subscribeToItemRequests((liveRequests) => {
        liveRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setItemRequests(liveRequests);
      });
      const savedLeads = await fetchAllLeads();
      savedLeads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setLeads(savedLeads);
      setLoaded(true);
    })();
    return () => {
      unsubOrders();
      unsubReviews();
      unsubItemRequests();
      unsubCatalog();
      unsubBoxes();
      unsubPromoCodes();
      unsubSuppliers();
      unsubCustomProducts();
    };
  }, []);

  const cartCount = cart.reduce((s, c) => s + c.qty, 0);
  const subtotal = cart.reduce((s, c) => s + c.qty * c.price, 0);
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null); // { code, ...PROMO_CODES[code] }
  const [promoError, setPromoError] = useState("");
  function applyPromoCode(codeRaw) {
    const code = codeRaw.trim().toUpperCase();
    const found = promoCodesDb[code];
    if (found) {
      setAppliedPromo({ code, ...found });
      setPromoError("");
      return;
    }
    // Referral codes are generated per-customer (name + short uid fragment),
    // not stored in a fixed list, so recognize the pattern instead of a lookup.
    const myOwnCode = user ? referralCodeFor(user.uid, profile?.name) : null;
    if (code === myOwnCode) {
      setPromoError(lang === "ar" ? "لا يمكنك استخدام كود الإحالة الخاص بك" : "You can't use your own referral code");
      setAppliedPromo(null);
      return;
    }
    if (/^[A-Z]{1,6}[A-Z0-9]{4}$/.test(code)) {
      setAppliedPromo({ code, type: "fixed", value: REFERRAL_DISCOUNT, label: lang === "ar" ? "خصم إحالة صديق" : "Referral discount", isReferral: true });
      setPromoError("");
      return;
    }
    setPromoError(lang === "ar" ? "كود غير صالح" : "Invalid code");
    setAppliedPromo(null);
  }
  function removePromoCode() {
    setAppliedPromo(null);
    setPromoInput("");
    setPromoError("");
  }
  const discount = appliedPromo
    ? Math.min(subtotal, appliedPromo.type === "percent" ? Math.round(subtotal * (appliedPromo.value / 100) * 100) / 100 : appliedPromo.value)
    : 0;
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const pointsBalance = profile?.loyaltyPoints || 0;
  // 1 point = AED 1 off, capped at whatever balance the customer actually
  // has and at what's left of the order after the promo code discount —
  // can't redeem more points than there is order value left to discount.
  const pointsDiscount = Math.max(0, Math.min(pointsToRedeem, pointsBalance, subtotal - discount));
  const discountedSubtotal = subtotal - discount - pointsDiscount;
  const deliveryFee = subtotal === 0 || subtotal >= FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE;
  const vat = Math.round((discountedSubtotal + deliveryFee) * VAT_RATE * 100) / 100;
  const total = discountedSubtotal + deliveryFee + vat;
  // Earned on what's actually paid toward products (after discounts), not
  // on delivery or VAT — 5% back, rounded down to a whole point.
  const pointsToEarn = Math.floor(discountedSubtotal * LOYALTY_EARN_RATE);

  function addToCart(entry) {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === entry.id);
      if (existing) {
        return prev.map((c) => (c.id === entry.id ? { ...c, qty: c.qty + entry.qty } : c));
      }
      return [...prev, entry];
    });
  }
  function setCartQty(id, qty) {
    setCart((prev) => (qty <= 0 ? prev.filter((c) => c.id !== id) : prev.map((c) => (c.id === id ? { ...c, qty } : c))));
  }
  function removeFromCart(id) {
    setCart((prev) => prev.filter((c) => c.id !== id));
  }
  function reorder(order) {
    setCart(order.items.map((it) => ({ ...it })));
    setView("cart");
  }

  async function placeOrder(order) {
    const shortfalls = findStockShortfalls(order);
    if (shortfalls.length > 0) {
      return { reason: "stock", shortfalls }; // let CheckoutView explain exactly what changed
    }
    const currentUser = auth.currentUser; // read live from Firebase, not React state — avoids any risk of acting on a stale render
    if (currentUser) {
      order = { ...order, customer: { ...order.customer, uid: currentUser.uid, email: currentUser.email } };
      saveProfile(currentUser.uid, {
        name: order.customer.name,
        phone: order.customer.phone,
        address: order.customer.address,
        area: order.customer.area,
        email: currentUser.email,
      }); // fire-and-forget: save their details so checkout is pre-filled next time
      setProfile((prev) => ({ ...prev, name: order.customer.name, phone: order.customer.phone, address: order.customer.address, area: order.customer.area }));
    }
    const saved = await saveOrderDoc(order); // its own document — can't clobber anyone else's order
    if (!saved) {
      return { reason: "connection" }; // let CheckoutView show a real error and keep the cart intact so the customer can retry
    }
    await decrementStockForOrder(order);
    setOrders((prev) => [order, ...prev]);
    if (currentUser && order.customer.subscribeWeekly) {
      const frequency = order.customer.subscriptionFrequency || "weekly";
      const sub = {
        id: "SUB" + Date.now().toString(36).toUpperCase(),
        uid: currentUser.uid,
        customerName: order.customer.name,
        customerPhone: order.customer.phone,
        customerAddress: order.customer.address,
        customerArea: order.customer.area,
        customerSlot: order.customer.slot,
        leaveAtDoor: !!order.customer.leaveAtDoor,
        items: order.items, // exact cart snapshot re-ordered every cycle
        frequency,
        status: "active", // "active" | "paused" | "cancelled"
        nextDeliveryDate: nextSubscriptionDate(order.customer.date, frequency).toISOString(),
        lastOrderCreatedDate: order.customer.date, // today's order already covers the first cycle
        createdAt: new Date().toISOString(),
      };
      saveSubscriptionDoc(sub); // fire-and-forget
    }
    if (currentUser && (order.pointsRedeemed || order.pointsEarned)) {
      const newBalance = Math.max(0, (profile?.loyaltyPoints || 0) - (order.pointsRedeemed || 0) + (order.pointsEarned || 0));
      saveProfile(currentUser.uid, { loyaltyPoints: newBalance }); // fire-and-forget
      setProfile((prev) => ({ ...prev, loyaltyPoints: newBalance }));
    }
    sendOrderNotificationEmail(order); // fire-and-forget; safe no-op until EmailJS keys are set
    sendOrderNotificationWhatsApp(order); // fire-and-forget; safe no-op until CallMeBot key is set
    setCart([]);
    setAppliedPromo(null);
    setPromoInput("");
    setPointsToRedeem(0);
    setLastOrderId(order.id);
    setLastOrder(order);
    setView("confirmation");
    return true;
  }

  // Runs once when the app loads (customer or Backstage — whichever opens
  // first that day) and turns any subscription whose delivery date has
  // arrived into a real order, the same way a manual checkout would. This
  // is what makes recurring delivery actually automatic without needing a
  // real backend/cron job: as long as *someone* opens the app that day,
  // due subscriptions get processed. lastOrderCreatedDate guards against
  // creating the same day's order twice if multiple tabs load at once.
  async function processDueSubscriptions() {
    const todayStr = localDateISO();
    const allSubs = await fetchAllSubscriptions();
    const due = allSubs.filter((s) => s.status === "active" && s.lastOrderCreatedDate !== todayStr && new Date(s.nextDeliveryDate) <= new Date());
    for (const sub of due) {
      const order = {
        id: genOrderId(),
        createdAt: new Date().toISOString(),
        customer: {
          name: sub.customerName, phone: sub.customerPhone, address: sub.customerAddress, area: sub.customerArea,
          date: todayStr, slot: sub.customerSlot, payment: "cod", leaveAtDoor: sub.leaveAtDoor,
          uid: sub.uid, subscriptionId: sub.id,
        },
        items: sub.items,
        subtotal: sub.items.reduce((s, it) => s + it.qty * it.price, 0),
        discount: 0, pointsRedeemed: 0, pointsEarned: 0,
        deliveryFee: sub.items.reduce((s, it) => s + it.qty * it.price, 0) >= FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE,
        status: "placed",
      };
      order.vat = Math.round((order.subtotal + order.deliveryFee) * VAT_RATE * 100) / 100;
      order.total = order.subtotal + order.deliveryFee + order.vat;
      const saved = await saveOrderDoc(order);
      if (saved) {
        await decrementStockForOrder(order);
        setOrders((prev) => [order, ...prev]);
        // Same business alerts a manually-placed order gets — without these,
        // a subscription renewing in the background was completely silent:
        // no ping to the business, nothing for the admin to act on until
        // someone happened to open the Orders tab and noticed it by chance.
        sendOrderNotificationEmail(order); // fire-and-forget; safe no-op until EmailJS keys are set
        sendOrderNotificationWhatsApp(order); // fire-and-forget; safe no-op until CallMeBot key is set
        await updateSubscriptionDoc(sub.id, {
          lastOrderCreatedDate: todayStr,
          nextDeliveryDate: nextSubscriptionDate(todayStr, sub.frequency).toISOString(),
        });
      }
    }
  }

  // Runs only in the admin's own Backstage session (see the adminAuthed
  // effect below) — never depends on a customer's browser staying open.
  // Tracks which products have already triggered an alert in
  // "dsf-low-stock-alerted" so this doesn't re-ping every single time
  // Backstage loads while something's still sitting low; that flag clears
  // once a product is restocked back above the threshold, so it's ready
  // to alert again the next time it runs low.
  async function checkLowStockAndAlert() {
    const alerted = (await storageGet("dsf-low-stock-alerted")) || {};
    const stillLow = {};
    const toAlert = [];
    products.forEach((p) => {
      if (typeof p.stock !== "number") return;
      if (p.stock <= LOW_STOCK_THRESHOLD) {
        stillLow[p.id] = true;
        if (!alerted[p.id]) toAlert.push(p);
      }
      // anything not carried into stillLow is implicitly cleared, i.e. back above threshold
    });
    if (toAlert.length > 0) sendLowStockAlertWhatsApp(toAlert);
    await storageSet("dsf-low-stock-alerted", stillLow);
  }

  async function updateOrderStatus(id, status) {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    return await updateOrderStatusDoc(id, status);
  }

  async function acknowledgeOrder(id) {
    const acknowledgedAt = new Date().toISOString();
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, acknowledgedAt } : o)));
    return await acknowledgeOrderDoc(id);
  }

  async function approveReview(id, approved) {
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, approved } : r)));
    return await setReviewApproved(id, approved);
  }

  async function deleteReview(id) {
    setReviews((prev) => prev.filter((r) => r.id !== id));
    return await deleteReviewDoc(id);
  }

  async function addCustomProduct(product) {
    const next = [...customProducts, product];
    setCustomProducts(next);
    return await storageSet("dsf-custom-products", next);
  }

  async function updateCustomProduct(id, patch) {
    const next = customProducts.map((p) => (p.id === id ? { ...p, ...patch } : p));
    setCustomProducts(next);
    return await storageSet("dsf-custom-products", next);
  }

  async function deleteCustomProduct(id) {
    const next = customProducts.filter((p) => p.id !== id);
    setCustomProducts(next);
    return await storageSet("dsf-custom-products", next);
  }

  async function addSupplier(supplier) {
    const next = [...suppliers, supplier];
    setSuppliers(next);
    return await storageSet("dsf-suppliers", next);
  }

  async function deleteSupplier(id) {
    const next = suppliers.filter((s) => s.id !== id);
    setSuppliers(next);
    return await storageSet("dsf-suppliers", next);
  }

  async function submitLead(lead) {
    const entry = { id: "L" + Date.now().toString(36).toUpperCase(), createdAt: new Date().toISOString(), ...lead };
    setLeads((prev) => [entry, ...prev]);
    await saveLeadDoc(entry);
    if (entry.bizType === "Office Box") sendOfficeLeadAlertWhatsApp(entry); // fire-and-forget; safe no-op until CallMeBot key is set
  }

  async function submitItemRequest(request) {
    const entry = { id: "IR" + Date.now().toString(36).toUpperCase(), createdAt: new Date().toISOString(), status: "pending", ...request };
    const saved = await saveItemRequestDoc(entry);
    if (saved) {
      setItemRequests((prev) => [entry, ...prev]);
      sendItemRequestAlertWhatsApp(entry); // fire-and-forget; safe no-op until CallMeBot key is set
    }
    return saved; // let the form show a real error instead of a false "Thanks!" on failure
  }

  async function updateItemRequestStatus(id, status) {
    setItemRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    await updateItemRequestStatusDoc(id, status);
  }

  async function updateProduct(id, patch) {
    const next = products.map((p) => (p.id === id ? { ...p, ...patch } : p));
    setProducts(next);
    const overrides = {};
    next.forEach((p) => {
      overrides[p.id] = { price: p.price, available: p.available, unit: p.unit, photoUrl: p.photoUrl || null, stock: p.stock == null ? null : p.stock, salePrice: p.salePrice == null ? null : p.salePrice, origin: p.origin || null, shippingMethod: p.shippingMethod || null, tierPieces: p.tierPieces || null };
    });
    return await storageSet("dsf-catalog-overrides", overrides, true);
  }
  // Shared by validation (before saving) and the actual decrement (after
  // saving) — productId -> total qty this order would consume.
  function computeDeductions(order) {
    const deductions = {};
    order.items.forEach((item) => {
      if (item.kind === "item") {
        deductions[item.id] = (deductions[item.id] || 0) + item.qty;
      }
      if (item.breakdown) {
        item.breakdown.forEach((b) => {
          const match = products.find((p) => p.name === b.name);
          if (match) deductions[match.id] = (deductions[match.id] || 0) + b.qty * item.qty;
        });
      }
    });
    return deductions;
  }
  // Last-moment check against current stock — catches the case where stock
  // changed (e.g. another customer bought the last few) between adding to
  // cart and hitting "Place order". Returns a list of items that no longer
  // fit, empty if everything's fine.
  function findStockShortfalls(order) {
    const deductions = computeDeductions(order);
    const shortfalls = [];
    Object.entries(deductions).forEach(([productId, needed]) => {
      const product = products.find((p) => p.id === productId);
      if (product && typeof product.stock === "number" && needed > product.stock) {
        shortfalls.push({ name: product.name, available: product.stock });
      }
    });
    return shortfalls;
  }
  // Deducts purchased quantities from stock the moment an order is placed —
  // covers plain per-unit items and fruit pulled from a custom box breakdown.
  // Note: this is a read-then-write against the current in-memory catalog,
  // not a Firestore transaction — fine at small-business order volumes, but
  // two orders landing in the same instant could in theory both read the
  // same starting stock. Worth revisiting with Firestore transactions if
  // order volume grows enough for that race to matter in practice.
  async function decrementStockForOrder(order) {
    const deductions = computeDeductions(order);
    if (Object.keys(deductions).length === 0) return;
    const next = products.map((p) =>
      typeof p.stock === "number" && deductions[p.id]
        ? { ...p, stock: Math.max(0, p.stock - deductions[p.id]) }
        : p
    );
    setProducts(next);
    const overrides = {};
    next.forEach((p) => {
      overrides[p.id] = { price: p.price, available: p.available, unit: p.unit, photoUrl: p.photoUrl || null, stock: p.stock == null ? null : p.stock, salePrice: p.salePrice == null ? null : p.salePrice, origin: p.origin || null, shippingMethod: p.shippingMethod || null, tierPieces: p.tierPieces || null };
    });
    await storageSet("dsf-catalog-overrides", overrides, true);
    // Deliberately no alert fired from here — this function runs inside
    // the CUSTOMER's browser during checkout, and a business alert has no
    // business depending on a stranger's device staying open. The check
    // for what's newly low happens instead in the admin's own Backstage
    // session — see checkLowStockAndAlert(), triggered on admin login.
  }
  async function updateBox(id, patch) {
    const next = boxes.map((b) => (b.id === id ? { ...b, ...patch } : b));
    setBoxes(next);
    const overrides = {};
    next.forEach((b) => {
      // Firestore rejects any field set to undefined — the 4 non-fruit
      // boxes never had a pieceCount to begin with, so without this null
      // fallback that one undefined field was silently failing the write
      // for every box bundled into this same document, not just that one.
      overrides[b.id] = {
        price: b.price,
        available: b.available,
        pieceCount: b.pieceCount == null ? null : b.pieceCount,
        weight: b.weight == null ? null : b.weight,
        salePrice: b.salePrice == null ? null : b.salePrice,
      };
    });
    return await storageSet("dsf-box-overrides", overrides, true);
  }
  async function savePromoCode(code, data) {
    const next = { ...promoCodesDb, [code]: data };
    setPromoCodesDb(next);
    await storageSet("dsf-promo-codes", next, true);
  }
  async function deletePromoCode(code) {
    const next = { ...promoCodesDb };
    delete next[code];
    setPromoCodesDb(next);
    await storageSet("dsf-promo-codes", next, true);
  }

  return (
    <div dir={dir} style={{ fontFamily: lang === "ar" ? "Cairo, sans-serif" : "Manrope, sans-serif", background: BRAND.cream, minHeight: "100vh", color: BRAND.ink }}>
      {updateAvailable && (
        <div
          className="no-print"
          style={{
            background: BRAND.gold, color: "#fff", textAlign: "center", padding: "9px 14px",
            fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, flexWrap: "wrap",
          }}
        >
          <span>{lang === "ar" ? "يتوفر إصدار جديد من الموقع." : "A new version of the site is available."}</span>
          <button
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.set("_v", Date.now().toString());
              window.location.replace(url.toString());
            }}
            style={{ background: "#fff", color: BRAND.orangeDeep, border: "none", borderRadius: 999, padding: "5px 14px", fontWeight: 800, cursor: "pointer", fontSize: 12.5 }}
          >
            {lang === "ar" ? "تحديث الآن" : "Refresh now"}
          </button>
        </div>
      )}
      <Header view={view} setView={setView} cartCount={cartCount} user={user} profile={profile} setActiveCategory={setActiveCategory} activeCategory={activeCategory} />
      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "0 18px 64px" }}>
        {view === "home" && <HomeView setView={setView} setActiveCategory={setActiveCategory} lang={lang} boxes={boxes} products={allProducts} reviews={reviews} />}
        {view === "shop" && (
          <ShopView
            products={allProducts}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            addToCart={addToCart}
            cart={cart}
            lang={lang}
            onSubmitItemRequest={submitItemRequest}
          />
        )}
        {view === "boxes" && <BoxesView addToCart={addToCart} cart={cart} lang={lang} boxes={boxes} products={allProducts} />}
        {view === "freshboxes" && <FreshBoxesView products={allProducts} addToCart={addToCart} cart={cart} setView={setView} lang={lang} activeCategory={activeCategory} setActiveCategory={setActiveCategory} onSubmitItemRequest={submitItemRequest} />}
        {view === "commercial" && <CommercialView onSubmitLead={submitLead} />}
        {view === "cart" && (
          <CartView
            cart={cart}
            setCartQty={setCartQty}
            removeFromCart={removeFromCart}
            subtotal={subtotal}
            deliveryFee={deliveryFee}
            vat={vat}
            discount={discount}
            total={total}
            setView={setView}
            lang={lang}
            promoInput={promoInput}
            setPromoInput={setPromoInput}
            appliedPromo={appliedPromo}
            promoError={promoError}
            applyPromoCode={applyPromoCode}
            removePromoCode={removePromoCode}
            products={allProducts}
            addToCart={addToCart}
            pointsBalance={pointsBalance}
            pointsToRedeem={pointsToRedeem}
            setPointsToRedeem={setPointsToRedeem}
            pointsDiscount={pointsDiscount}
            user={user}
          />
        )}
        {view === "checkout" && (
          authLoading ? (
            <div style={{ paddingTop: 60, textAlign: "center", opacity: 0.6 }}>Loading…</div>
          ) : user ? (
            <CheckoutView cart={cart} subtotal={subtotal} deliveryFee={deliveryFee} vat={vat} discount={discount} appliedPromo={appliedPromo} total={total} onPlaceOrder={placeOrder} setView={setView} profile={profile} lang={lang} pointsDiscount={pointsDiscount} pointsToEarn={pointsToEarn} />
          ) : (
            <CheckoutSignInGate setView={setView} lang={lang} />
          )
        )}
        {view === "confirmation" && <ConfirmationView order={lastOrder} orderId={lastOrderId} setView={setView} />}
        {view === "track" && <TrackView orders={orders} initialId={manualTrackId || deepLinkOrderId || lastOrderId} lang={lang} />}
        {view === "drive" && <DriverModeView orderId={driveOrderId} lang={lang} />}
        {view === "invoice" && <InvoiceView orderId={invoiceOrderId} orders={orders} />}
        {view === "privacy" && <PrivacyView setView={setView} />}
        {view === "terms" && <TermsView setView={setView} />}
        {view === "location" && <LocationView setView={setView} />}
        {view === "about" && <AboutView setView={setView} />}
        {view === "recipes" && <RecipesView setView={setView} products={allProducts} addToCart={addToCart} deepLinkRecipeId={deepLinkRecipeId} />}
        {view === "blog" && <BlogView setView={setView} />}
        {view === "fruitbuilder" && <FruitBoxBuilder products={allProducts} addToCart={addToCart} cart={cart} setView={setView} lang={lang} />}
        {view === "vegetablebuilder" && <VegetableBoxBuilder products={allProducts} addToCart={addToCart} cart={cart} setView={setView} lang={lang} />}
        {view === "account" && (
          <AccountView
            user={user}
            profile={profile}
            authLoading={authLoading}
            orders={orders}
            setView={setView}
            onProfileSaved={setProfile}
            lang={lang}
            onReorder={reorder}
            onTrackOrder={(id) => {
              setManualTrackId(id);
              setView("track");
            }}
          />
        )}
        {view === "admin" &&
          (adminAuthed ? (
            <AdminView products={products} updateProduct={updateProduct} boxes={boxes} updateBox={updateBox} orders={orders} updateOrderStatus={updateOrderStatus} acknowledgeOrder={acknowledgeOrder} leads={leads} promoCodesDb={promoCodesDb} savePromoCode={savePromoCode} deletePromoCode={deletePromoCode} reviews={reviews} approveReview={approveReview} deleteReview={deleteReview} customProducts={customProducts} addCustomProduct={addCustomProduct} updateCustomProduct={updateCustomProduct} deleteCustomProduct={deleteCustomProduct} suppliers={suppliers} addSupplier={addSupplier} deleteSupplier={deleteSupplier} itemRequests={itemRequests} updateItemRequestStatus={updateItemRequestStatus} />
          ) : (
            <AdminLogin onSuccess={() => setAdminAuthed(true)} />
          ))}
      </main>
      <Footer setView={setView} lang={lang} />
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    this.setState({ info });
    console.error("Darousha Fresh crashed:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: "monospace", background: "#fff", color: "#a83b32", minHeight: "100vh" }}>
          <h2 style={{ color: "#123822", fontFamily: "sans-serif" }}>Darousha Fresh hit an error</h2>
          <p style={{ fontFamily: "sans-serif", color: "#333" }}>Please read or screenshot everything below and send it back:</p>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 13, background: "#f7f1e4", padding: 14, borderRadius: 8, border: "1px solid #ebe1c9" }}>
            {String(
              (this.state.error && (this.state.error.name || "") + ": " + (this.state.error.message || "")) + "\n" +
              (this.state.error && this.state.error.stack ? this.state.error.stack : "") +
              (this.state.info && this.state.info.componentStack ? "\n\nComponent stack:" + this.state.info.componentStack : "")
            )}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <LangProvider>
        <AppShell />
      </LangProvider>
    </ErrorBoundary>
  );
}

/* ------------------------------------ Header ------------------------------------ */

function Header({ view, setView, cartCount, user, profile, setActiveCategory, activeCategory }) {
  const { t, lang } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);
  const navItem = (key, label, Icon, onClick, isActiveOverride, mobile) => {
    const isActive = typeof isActiveOverride === "boolean" ? isActiveOverride : view === key;
    const handleClick = () => {
      (onClick || (() => setView(key)))();
      if (mobile) setMenuOpen(false);
    };
    return mobile ? (
      <button
        onClick={handleClick}
        style={{
          background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center",
          gap: 12, width: "100%", textAlign: "start", padding: "14px 6px",
          borderBottom: `1px solid rgba(255,255,255,0.12)`,
          color: isActive ? BRAND.orange : BRAND.cream,
          fontFamily: lang === "ar" ? "Cairo, sans-serif" : "Manrope, sans-serif",
          fontWeight: 700, fontSize: 16,
        }}
      >
        <Icon size={18} /> {label}
      </button>
    ) : (
      <button
        onClick={handleClick}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexShrink: 0,
          whiteSpace: "nowrap",
          color: isActive ? BRAND.orangeDeep : BRAND.green,
          fontFamily: lang === "ar" ? "Cairo, sans-serif" : "Manrope, sans-serif",
          fontWeight: 700,
          fontSize: 14,
          padding: "6px 4px",
          borderBottom: isActive ? `2px solid ${BRAND.orange}` : "2px solid transparent",
        }}
      >
        <Icon size={15} /> {label}
      </button>
    );
  };
  const navLinks = (mobile) => (
    <>
      {navItem("boxes", t("nav_boxes"), Package, undefined, undefined, mobile)}
      {navItem("freshboxes", lang === "ar" ? "كل الأصناف" : "All Items", Store, () => { setActiveCategory && setActiveCategory("All"); setView("freshboxes"); }, view === "freshboxes" && activeCategory !== "Fruits" && activeCategory !== "Gourmet & Gifts", mobile)}
      {navItem("freshboxes", lang === "ar" ? "فواكه" : "Fruits", Citrus, () => { setActiveCategory && setActiveCategory("Fruits"); setView("freshboxes"); }, view === "freshboxes" && activeCategory === "Fruits", mobile)}
      {navItem("freshboxes", lang === "ar" ? "أطعمة فاخرة" : "Gourmet & Gifts", Gift, () => { setActiveCategory && setActiveCategory("Gourmet & Gifts"); setView("freshboxes"); }, view === "freshboxes" && activeCategory === "Gourmet & Gifts", mobile)}
      {navItem("recipes", lang === "ar" ? "وصفات" : "Recipes", BookOpen, undefined, undefined, mobile)}
      {navItem("commercial", t("nav_commercial"), Building2, undefined, undefined, mobile)}
      {navItem("track", t("nav_track"), Truck, undefined, undefined, mobile)}
      {navItem("account", user ? (profile?.name || t("nav_account")) : t("nav_signin"), UserIcon, undefined, undefined, mobile)}
    </>
  );
  return (
    <header
      className="no-print"
      style={{
        background: "rgba(247,241,228,0.86)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        position: "sticky",
        top: 0,
        zIndex: 40,
        borderBottom: `1px solid rgba(35,31,22,0.08)`,
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "10px 18px", display: "flex", alignItems: "center", gap: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", flexShrink: 0 }} onClick={() => setView("home")}>
          <Logo size={64} />
        </div>
        <nav
          className="dsf-header-nav"
          style={{
            display: "flex", alignItems: "center", gap: 18, overflowX: "auto",
            flex: 1, minWidth: 0, scrollbarWidth: "none",
          }}
        >
          {navLinks(false)}
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, marginLeft: "auto" }}>
          <LangToggle />
          <button
            onClick={() => setView("cart")}
            style={{
              position: "relative",
              background: BRAND.green,
              border: "none",
              borderRadius: 8,
              padding: "9px 12px",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontWeight: 700,
            }}
          >
            <ShoppingCart size={17} />
            <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 13 }}>{cartCount}</span>
          </button>
          <button
            className="dsf-header-hamburger"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menu"
            style={{
              display: "none", background: "rgba(35,31,22,0.08)", border: "none", borderRadius: 8,
              padding: 9, color: BRAND.green, cursor: "pointer", alignItems: "center", justifyContent: "center",
            }}
          >
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>
      {menuOpen && (
        <>
          <div
            onClick={() => setMenuOpen(false)}
            style={{ position: "fixed", inset: 0, top: 0, background: "rgba(0,0,0,0.4)", zIndex: 39 }}
          />
          <div style={{ background: BRAND.greenDark, padding: "4px 18px 18px", position: "relative", zIndex: 41 }}>
            {navLinks(true)}
          </div>
        </>
      )}
    </header>
  );
}

/* ------------------------------------ Home ------------------------------------ */

function HomeView({ setView, setActiveCategory, boxes, products, reviews }) {
  const { t, lang } = useLang();
  const gourmetProducts = (products || []).filter((p) => p.category === "Gourmet & Gifts" && p.available);
  const approvedReviews = (reviews || []).filter((r) => r.approved);

  return (
    <div>
      {/* HERO — full-bleed photo with editorial overlay */}
      <section
        style={{
          position: "relative",
          minHeight: "62vh",
          marginTop: 22,
          borderRadius: 24,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
        }}
        className="dsf-hero"
      >
        <img
          src="/images/veg-crate-hero.jpg"
          alt="Abundant crate of fresh, vibrant vegetables"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            background: `linear-gradient(90deg, ${BRAND.cream} 0%, rgba(247,241,228,0.62) 45%, rgba(247,241,228,0.05) 78%)`,
          }}
        />
        <div style={{ position: "relative", zIndex: 2, padding: "48px 40px", maxWidth: 480 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, color: BRAND.orangeDeep, padding: "5px 0", fontSize: 12.5, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 16 }}>
            {t("hero_badge")}
          </div>
          <h1 style={{ fontFamily: lang === "ar" ? "Cairo, sans-serif" : "Playfair Display, serif", fontSize: 44, lineHeight: 1.08, margin: "0 0 14px", fontWeight: 800, color: BRAND.ink }}>
            {t("hero_h1a")}<br /> {t("hero_h1b")} <span style={{ color: BRAND.orangeDeep, fontStyle: "italic" }}>{t("hero_h1c")}</span>
          </h1>
          <p style={{ fontSize: 15.5, color: BRAND.ink, opacity: 0.75, maxWidth: 420, marginBottom: 26 }}>
            {t("hero_sub")}
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <PrimaryButton onClick={() => setView("boxes")}>
              {t("hero_cta_boxes")} <ChevronRight size={16} />
            </PrimaryButton>
            <GhostButton onClick={() => setView("commercial")}>
              {lang === "ar" ? "للأعمال التجارية" : "For Business"}
            </GhostButton>
          </div>
        </div>
      </section>

      {/* Brand badges */}
      <div style={{ display: "flex", justifyContent: "center", gap: 28, flexWrap: "wrap", padding: "26px 10px 4px" }}>
        {[
          { label: t("badge_quality"), icon: Leaf },
          { label: t("badge_fresh"), icon: Package },
          { label: t("badge_supply"), icon: UserIcon },
          { label: t("badge_delivery"), icon: Truck },
        ].map((b) => (
          <div key={b.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, width: 92 }}>
            <div style={{ width: 46, height: 46, borderRadius: "50%", border: `1px solid ${BRAND.gold}`, display: "flex", alignItems: "center", justifyContent: "center", color: BRAND.gold }}>
              <b.icon size={19} />
            </div>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.05em", textTransform: lang === "ar" ? "none" : "uppercase", textAlign: "center", color: BRAND.ink, opacity: 0.75 }}>{b.label}</div>
          </div>
        ))}
      </div>

      {/* 3-step delivery explainer */}
      <section style={{ marginTop: 40 }}>
        <SectionTitle eyebrow={t("how_eyebrow")} title={t("how_title")} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 16, marginTop: 18 }}>
          {[
            { icon: Store, title: t("how1_t"), body: t("how1_b") },
            { icon: Package, title: t("how2_t"), body: t("how2_b") },
            { icon: Truck, title: t("how3_t"), body: t("how3_b") },
          ].map((s, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 16, padding: 22, border: "1px solid rgba(198,162,76,0.22)", boxShadow: "0 2px 10px rgba(35,31,22,0.05)" }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: BRAND.greenSoft, display: "flex", alignItems: "center", justifyContent: "center", color: BRAND.green, marginBottom: 12 }}>
                <s.icon size={20} />
              </div>
              <div style={{ fontFamily: lang === "ar" ? "Cairo, sans-serif" : "Playfair Display, serif", fontWeight: 700, fontSize: 17, marginBottom: 6 }}>{s.title}</div>
              <div style={{ fontSize: 13.5, opacity: 0.75, lineHeight: 1.5 }}>{s.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Build Your Own Fruit Box */}
      <section style={{ marginTop: 44 }}>
        <div
          style={{
            background: `linear-gradient(160deg, ${BRAND.green} 0%, ${BRAND.greenDark} 100%)`,
            borderRadius: 24, overflow: "hidden", display: "grid",
            gridTemplateColumns: "1fr 1fr", alignItems: "stretch",
          }}
          className="dsf-hero"
        >
          <div style={{ padding: "36px 30px", color: BRAND.cream, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ fontSize: 26 }}>🍓</div>
            <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 28, fontWeight: 800, margin: "10px 0 8px" }}>
              {lang === "ar" ? "الطزاجة، بطريقتك." : "Freshness, your way."}
            </h2>
            <p style={{ fontSize: 14.5, opacity: 0.9, lineHeight: 1.7, maxWidth: 420 }}>
              {lang === "ar"
                ? "في داروشة فريش، يمكنك الآن تكوين صندوق الفواكه المميز الخاص بك باختيار فواكهك المفضلة. سواء كان لعائلتك، أو هدية مميزة، أو لأسلوب حياة صحي، سنختار كل فاكهة بعناية ونوصلها طازجة إلى باب منزلك."
                : "You can now build your own premium fruit box by selecting your favorite fruits. Whether it's for your family, a thoughtful gift, or a healthy lifestyle, we'll handpick every fruit with care and deliver it fresh to your doorstep."}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 16, fontSize: 13.5, fontWeight: 600 }}>
              <span>🍎 {lang === "ar" ? "فواكه مميزة مختارة يدويًا" : "Handpicked Premium Fruits"}</span>
              <span>🍇 {lang === "ar" ? "قابل للتخصيص بالكامل" : "Fully Customizable"}</span>
              <span>🎁 {lang === "ar" ? "تغليف أنيق كهدية" : "Elegant Gift Packaging"}</span>
              <span>🚚 {lang === "ar" ? "توصيل طازج في جميع أنحاء دبي" : "Fresh Delivery Across Dubai"}</span>
            </div>
            <div style={{ marginTop: 20 }}>
              <PrimaryButton onClick={() => setView("fruitbuilder")}>
                {lang === "ar" ? "ابنِ صندوق الفواكه الخاص بك" : "Build Your Fruit Box"} <ChevronRight size={16} />
              </PrimaryButton>
            </div>
          </div>
          <img
            src="/images/fruit-basket-hero.jpg"
            alt="Darousha Fresh premium fruit box"
            style={{ width: "100%", height: "100%", minHeight: 260, objectFit: "cover", display: "block" }}
          />
        </div>
      </section>

      {/* Build Your Own Vegetable Box — same structure as the fruit hero above, at a slightly smaller scale */}
      <section style={{ marginTop: 20 }}>
        <div
          style={{
            background: `linear-gradient(160deg, ${BRAND.greenDark} 0%, ${BRAND.green} 100%)`,
            borderRadius: 22, overflow: "hidden", display: "grid",
            gridTemplateColumns: "1fr 0.85fr", alignItems: "stretch",
          }}
          className="dsf-hero"
        >
          <div style={{ padding: "28px 26px", color: BRAND.cream, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ fontSize: 22 }}>🥬</div>
            <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 23, fontWeight: 800, margin: "8px 0 6px" }}>
              {lang === "ar" ? "الطزاجة، بطريقتك أيضًا." : "Freshness, your way too."}
            </h2>
            <p style={{ fontSize: 13.5, opacity: 0.9, lineHeight: 1.65, maxWidth: 420 }}>
              {lang === "ar"
                ? "ابنِ صندوق الخضروات الخاص بك باختيار خضرواتك المفضلة، بالكمية التي تريدها بالضبط. مثالي لعائلتك، لأسلوب حياة صحي، أو لتموين مطبخك الأسبوعي — سنختار كل خضار بعناية ونوصله طازجًا إلى باب منزلك."
                : "Build your own vegetable box by choosing exactly which vegetables you want, and exactly how much of each. Perfect for your family, a healthy routine, or restocking the kitchen for the week — we'll handpick every item with care and deliver it fresh to your door."}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 14, fontSize: 13, fontWeight: 600 }}>
              <span>🥕 {lang === "ar" ? "خضروات طازجة مختارة يدويًا" : "Handpicked Fresh Vegetables"}</span>
              <span>⚖️ {lang === "ar" ? "اختر الكمية بالضبط كما تريد" : "Choose the Exact Quantity You Want"}</span>
              <span>💰 {lang === "ar" ? "ادفع فقط لما تختاره" : "Pay Only for What You Choose"}</span>
              <span>🚚 {lang === "ar" ? "توصيل طازج في جميع أنحاء دبي" : "Fresh Delivery Across Dubai"}</span>
            </div>
            <div style={{ marginTop: 16 }}>
              <PrimaryButton onClick={() => setView("vegetablebuilder")}>
                {lang === "ar" ? "ابنِ صندوق الخضروات الخاص بك" : "Build Your Vegetable Box"} <ChevronRight size={16} />
              </PrimaryButton>
            </div>
          </div>
          <img
            src="/images/veg-crate-hero.jpg"
            alt="Darousha Fresh premium vegetable box"
            style={{ width: "100%", height: "100%", minHeight: 220, objectFit: "cover", display: "block" }}
          />
        </div>
      </section>

      {/* Fresh From Nature — poster gallery */}
      <section style={{ marginTop: 44 }}>
        <SectionTitle eyebrow={lang === "ar" ? "من الطبيعة" : "Fresh From Nature"} title={lang === "ar" ? "مباشرة من الحقل إلى بابك" : "Straight from the field to your door"} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: 14, marginTop: 18 }}>
          {[
            { src: POSTER_CHERRY_TOMATO_IMG, alt: "Darousha Fresh cherry tomatoes, freshly harvested" },
            { src: POSTER_RED_PEPPER_IMG, alt: "Darousha Fresh red bell peppers, freshly harvested" },
            { src: POSTER_CUCUMBER_IMG, alt: "Darousha Fresh cucumbers, freshly harvested" },
          ].map((p) => (
            <div key={p.alt} style={{ borderRadius: 16, overflow: "hidden", aspectRatio: "3/4", boxShadow: "0 6px 18px rgba(0,0,0,0.12)" }}>
              <img src={p.src} alt={p.alt} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
          ))}
        </div>
      </section>

      {/* Delivery fleet banner */}
      <section style={{ marginTop: 44 }}>
        <div style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.15)" }}>
          <img src={POSTER_VAN_IMG} alt="Darousha Fresh delivery van" style={{ width: "100%", display: "block", objectFit: "cover" }} />
        </div>
      </section>

      {/* Boxes teaser */}
      <section style={{ marginTop: 44 }}>
        <SectionTitle eyebrow={t("boxes_eyebrow")} title={t("boxes_title")} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px,1fr))", gap: 16, marginTop: 18 }}>
          {boxes.filter((b) => b.available).map((b) => (
            <div key={b.id} style={{ background: "#fff", border: "1px solid rgba(198,162,76,0.22)", boxShadow: "0 2px 10px rgba(35,31,22,0.05)", borderRadius: 18, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <img src={boxPhotoFor(b)} alt={`${b.name} — Darousha Fresh`} style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }} />
              <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: BRAND.greenDark, borderRadius: 999, padding: "3px 10px" }}>{b.weight}</span>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: BRAND.orangeDeep, textTransform: lang === "ar" ? "none" : "uppercase", letterSpacing: "0.04em" }}>{b.size}</span>
                {b.category && (
                  <span
                    style={{
                      fontSize: 11, fontWeight: 800, letterSpacing: "0.04em",
                      textTransform: lang === "ar" ? "none" : "uppercase",
                      color: "#fff", background: b.category === "Fruits" ? BRAND.orangeDeep : BRAND.green,
                      borderRadius: 999, padding: "3px 10px",
                    }}
                  >
                    {b.category === "Fruits" ? (lang === "ar" ? "🍎 فواكه" : "🍎 Fruits") : (lang === "ar" ? "🥬 خضروات" : "🥬 Vegetables")}
                  </span>
                )}
              </div>
              <div style={{ fontFamily: lang === "ar" ? "Cairo, sans-serif" : "Playfair Display, serif", fontWeight: 800, fontSize: 21 }}>{boxName(b.name, lang)}</div>
              <div style={{ fontSize: 12.5, opacity: 0.65 }}>{boxTag(b.tag, lang)}</div>
              <p style={{ fontSize: 13, opacity: 0.7, minHeight: 36 }}>
                {b.customizable
                  ? (lang === "ar"
                      ? `اختر أي ${b.pieceCount} عنصر من تشكيلة ${b.category === "Fruits" ? "الفواكه" : "الخضروات"} الطازجة لدينا — مزيجك أنت.`
                      : `Pick any ${b.pieceCount} items from our fresh ${b.category === "Fruits" ? "fruit" : "produce"} selection — your mix, your box.`)
                  : boxBlurb(b.blurb, lang)}
              </p>
              <PriceTag value={b.price} size="lg" />
              <PrimaryButton onClick={() => setView("boxes")} style={{ marginTop: 6 }}>
                {t("view_box")}
              </PrimaryButton>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Gourmet & Gifts teaser */}
      {gourmetProducts.length > 0 && (
        <section style={{ marginTop: 52 }}>
          <SectionTitle
            eyebrow={lang === "ar" ? "أطعمة فاخرة وهدايا" : "Gourmet & Gifts"}
            title={lang === "ar" ? "لمسة فاخرة لطلبك" : "A finishing touch for your order"}
          />
          <p style={{ opacity: 0.7, fontSize: 14, maxWidth: 560, marginTop: 8 }}>
            {lang === "ar"
              ? "توابل وزيوت ومنتجات فاخرة مختارة بعناية — هدايا رائعة أو إضافات مميزة لطلبك."
              : "Carefully sourced spices, oils, and preserves — great as a gift, or a little extra something with your order."}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: 16, marginTop: 20 }}>
            {gourmetProducts.map((p) => (
              <div key={p.id} style={{ background: "#fff", border: "1px solid rgba(198,162,76,0.22)", boxShadow: "0 2px 10px rgba(35,31,22,0.05)", borderRadius: 16, padding: 16, textAlign: "center" }}>
                <Thumb product={p} size={90} radius={12} />
                <div style={{ fontWeight: 700, fontSize: 14, marginTop: 10 }}>{prodName(p.name, lang)}</div>
                {productDescription(p, lang) && (
                  <div style={{ fontSize: 11.5, opacity: 0.65, lineHeight: 1.4, marginTop: 4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
                    {productDescription(p, lang)}
                  </div>
                )}
                <div style={{ marginTop: 6 }}>
                  <PriceTag value={effectivePrice(p)} originalValue={effectivePrice(p) !== p.price ? p.price : undefined} />
                </div>
                <PrimaryButton
                  onClick={() => { setActiveCategory("Gourmet & Gifts"); setView("freshboxes"); }}
                  style={{ marginTop: 12, padding: "8px 14px", fontSize: 13 }}
                >
                  {lang === "ar" ? "عرض" : "View"}
                </PrimaryButton>
              </div>
            ))}
          </div>
        </section>
      )}
      {approvedReviews.length > 0 && (
        <section style={{ marginTop: 52 }}>
          <SectionTitle
            eyebrow={lang === "ar" ? "آراء العملاء" : "Customer Reviews"}
            title={lang === "ar" ? "ماذا يقول عملاؤنا" : "What our customers are saying"}
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px,1fr))", gap: 16, marginTop: 20 }}>
            {approvedReviews.slice(0, 6).map((r) => (
              <div key={r.id} style={{ background: "#fff", border: "1px solid rgba(198,162,76,0.22)", boxShadow: "0 2px 10px rgba(35,31,22,0.05)", borderRadius: 16, overflow: "hidden" }}>
                {r.photoUrl && (
                  <img src={r.photoUrl} alt="" style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} />
                )}
                <div style={{ padding: 14 }}>
                  <div style={{ color: BRAND.gold, fontSize: 15, marginBottom: 6 }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
                  {r.text && <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.5, marginBottom: 8 }}>"{r.text}"</div>}
                  <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.6 }}>— {r.customerName}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      <section style={{ marginTop: 52 }}>
        <SectionTitle eyebrow={t("story_eyebrow")} title={t("story_title")} />
        <div style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 28, marginTop: 18, alignItems: "center" }} className="dsf-about-grid">
          <div>
            <p style={{ fontSize: 14.5, lineHeight: 1.75, opacity: 0.85 }}>
              {t("story_p1")}
            </p>
            <p style={{ fontSize: 14.5, lineHeight: 1.75, opacity: 0.85, marginTop: 12 }}>
              {t("story_p2")}
            </p>
            <p style={{ fontSize: 14.5, lineHeight: 1.75, opacity: 0.85, marginTop: 12 }}>
              {t("story_p3")}
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <img src={BOX_LARGE_IMG} alt="Signature Box" style={{ width: "100%", height: 220, objectFit: "cover", borderRadius: 14, gridColumn: "1 / 3" }} />
            <img src={BOX_SMALL_IMG} alt="Daily Box" style={{ width: "100%", height: 130, objectFit: "cover", borderRadius: 14 }} />
            <img src={BOX_MEDIUM_IMG} alt="Family Box" style={{ width: "100%", height: 130, objectFit: "cover", borderRadius: 14 }} />
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ eyebrow, title }) {
  const { lang } = useLang();
  return (
    <div>
      <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11.5, letterSpacing: "0.16em", textTransform: lang === "ar" ? "none" : "uppercase", color: BRAND.orangeDeep, fontWeight: 600 }}>{eyebrow}</div>
      <h2 style={{ fontFamily: lang === "ar" ? "Cairo, sans-serif" : "Playfair Display, serif", fontSize: 26, margin: "4px 0 0", fontWeight: 700 }}>{title}</h2>
    </div>
  );
}

/* ------------------------------------ Shop ------------------------------------ */

function ShopView({ products, activeCategory, setActiveCategory, addToCart, cart, onSubmitItemRequest }) {
  const { t, lang } = useLang();
  const [query, setQuery] = useState("");
  const categories = [...new Set(products.map((p) => p.category))];
  const filtered = products.filter((p) => {
    const matchesCat = activeCategory === "All" || p.category === activeCategory;
    const matchesQuery = query.trim() === "" || p.name.toLowerCase().includes(query.toLowerCase());
    return query.trim() ? matchesQuery : matchesCat;
  });

  return (
    <div style={{ paddingTop: 22 }}>
      <SectionTitle eyebrow={t("shop_eyebrow")} title={t("shop_title")} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, background: "#fff", border: "1px solid rgba(198,162,76,0.22)", boxShadow: "0 2px 10px rgba(35,31,22,0.05)", borderRadius: 12, padding: "10px 14px" }}>
        <Search size={16} color={BRAND.green} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search_placeholder")}
          style={{ border: "none", outline: "none", flex: 1, fontFamily: lang === "ar" ? "Cairo, sans-serif" : "Manrope, sans-serif", fontSize: 14 }}
        />
      </div>
      {!query.trim() && (
        <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "16px 2px" }}>
          {categories.map((c) => (
            <Pill key={c} active={c === activeCategory} onClick={() => setActiveCategory(c)}>
              {catName(c, lang)}
            </Pill>
          ))}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px,1fr))", gap: 14, marginTop: 10 }}>
        {filtered.map((p) => (
          <ProductCard key={p.id} product={p} addToCart={addToCart} cartQty={cart.find((c) => c.id === p.id)?.qty || 0} />
        ))}
      </div>
      {filtered.length === 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ opacity: 0.6, fontSize: 14, marginBottom: 12 }}>{t("no_results")} "{query}".</div>
          <ItemRequestForm prefillName={query} onSubmitItemRequest={onSubmitItemRequest} />
        </div>
      )}
      {filtered.length > 0 && (
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <ItemRequestLink onSubmitItemRequest={onSubmitItemRequest} />
        </div>
      )}
    </div>
  );
}

/* "Can't find it? Request it" — a lightweight always-available link that
   opens the same request form used in the empty search state, so the
   feature works whether or not the customer searched for anything. */
function ItemRequestLink({ onSubmitItemRequest }) {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  if (open) {
    return (
      <div style={{ textAlign: lang === "ar" ? "right" : "left" }}>
        <ItemRequestForm onSubmitItemRequest={onSubmitItemRequest} onClose={() => setOpen(false)} />
      </div>
    );
  }
  return (
    <button
      onClick={() => setOpen(true)}
      style={{ background: "none", border: "none", color: BRAND.green, fontWeight: 700, fontSize: 13, textDecoration: "underline", cursor: "pointer" }}
    >
      {lang === "ar" ? "لم تجد ما تبحث عنه؟ اطلبه منّا" : "Can't find it? Request it"}
    </button>
  );
}

function ItemRequestForm({ prefillName = "", onSubmitItemRequest, onClose }) {
  const { lang } = useLang();
  const [itemName, setItemName] = useState(prefillName);
  const [quantity, setQuantity] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  if (sent) {
    return (
      <div style={{ background: BRAND.greenSoft, border: "1px solid rgba(198,162,76,0.22)", boxShadow: "0 2px 10px rgba(35,31,22,0.05)", borderRadius: 12, padding: 14, fontSize: 13.5 }}>
        {lang === "ar" ? "شكرًا لك! تلقينا طلبك وسنتحقق من توفره قريبًا." : "Thanks! We got your request and we'll check availability soon."}
      </div>
    );
  }

  async function handleSubmit() {
    if (!itemName.trim() || busy) return;
    setBusy(true);
    setError(false);
    const saved = await onSubmitItemRequest({
      itemName: itemName.trim(),
      quantity: quantity.trim() || null,
      customerName: customerName.trim() || null,
      customerPhone: customerPhone.trim() || null,
      note: note.trim() || null,
    });
    setBusy(false);
    if (saved) {
      setSent(true);
    } else {
      setError(true);
    }
  }

  return (
    <div style={{ background: "#fff", border: "1px solid rgba(198,162,76,0.22)", boxShadow: "0 2px 10px rgba(35,31,22,0.05)", borderRadius: 14, padding: 16, maxWidth: 420 }}>
      <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 15, marginBottom: 10 }}>
        {lang === "ar" ? "اطلب صنفًا غير متوفر" : "Request an item"}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <input
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          placeholder={lang === "ar" ? "اسم الصنف" : "Item name"}
          style={{ border: "1px solid rgba(198,162,76,0.22)", boxShadow: "0 2px 10px rgba(35,31,22,0.05)", borderRadius: 10, padding: "9px 12px", fontSize: 13.5, fontFamily: lang === "ar" ? "Cairo, sans-serif" : "Manrope, sans-serif" }}
        />
        <input
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder={lang === "ar" ? "الكمية (اختياري)" : "Quantity (optional)"}
          style={{ border: "1px solid rgba(198,162,76,0.22)", boxShadow: "0 2px 10px rgba(35,31,22,0.05)", borderRadius: 10, padding: "9px 12px", fontSize: 13.5, fontFamily: lang === "ar" ? "Cairo, sans-serif" : "Manrope, sans-serif" }}
        />
        <input
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          placeholder={lang === "ar" ? "رقم الجوال (اختياري)" : "Phone number (optional)"}
          style={{ border: "1px solid rgba(198,162,76,0.22)", boxShadow: "0 2px 10px rgba(35,31,22,0.05)", borderRadius: 10, padding: "9px 12px", fontSize: 13.5, fontFamily: lang === "ar" ? "Cairo, sans-serif" : "Manrope, sans-serif" }}
        />
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={lang === "ar" ? "ملاحظة (اختياري)" : "Note (optional)"}
          rows={2}
          style={{ border: "1px solid rgba(198,162,76,0.22)", boxShadow: "0 2px 10px rgba(35,31,22,0.05)", borderRadius: 10, padding: "9px 12px", fontSize: 13.5, fontFamily: lang === "ar" ? "Cairo, sans-serif" : "Manrope, sans-serif", resize: "vertical" }}
        />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
        <PrimaryButton disabled={!itemName.trim() || busy} onClick={handleSubmit} style={{ padding: "9px 16px", fontSize: 13 }}>
          {busy ? (lang === "ar" ? "جارٍ الإرسال…" : "Sending…") : lang === "ar" ? "إرسال الطلب" : "Send request"}
        </PrimaryButton>
        {onClose && (
          <GhostButton onClick={onClose} style={{ padding: "9px 16px", fontSize: 13 }}>
            {lang === "ar" ? "إلغاء" : "Cancel"}
          </GhostButton>
        )}
        {error && (
          <span style={{ color: BRAND.tomato, fontSize: 12, fontWeight: 700 }}>
            {lang === "ar" ? "⚠ تعذّر الإرسال — حاول مرة أخرى" : "⚠ Failed to send — try again"}
          </span>
        )}
      </div>
    </div>
  );
}

function ProductCard({ product, addToCart, cartQty }) {
  const { t, lang } = useLang();
  const [qty, setQty] = useState(1);
  const hasStockLimit = typeof product.stock === "number";
  const remaining = hasStockLimit ? Math.max(0, product.stock - cartQty) : Infinity;
  const soldOut = hasStockLimit && remaining === 0;
  const canOrder = product.available && !soldOut;
  useEffect(() => {
    if (hasStockLimit && qty > remaining) setQty(Math.max(1, remaining));
  }, [remaining, hasStockLimit]);
  return (
    <div style={{ background: "#fff", border: "1px solid rgba(198,162,76,0.22)", boxShadow: "0 2px 10px rgba(35,31,22,0.05)", borderRadius: 16, padding: 14, display: "flex", flexDirection: "column", gap: 8, opacity: canOrder ? 1 : 0.55, position: "relative" }}>
      {!product.available && (
        <div style={{ position: "absolute", top: 10, right: 10, background: BRAND.tomato, color: "#fff", fontSize: 10.5, fontWeight: 700, padding: "3px 8px", borderRadius: 999 }}>
          {t("out_of_stock")}
        </div>
      )}
      {product.available && soldOut && (
        <div style={{ position: "absolute", top: 10, right: 10, background: BRAND.tomato, color: "#fff", fontSize: 10.5, fontWeight: 700, padding: "3px 8px", borderRadius: 999 }}>
          {lang === "ar" ? "نفدت الكمية" : "Sold out"}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Thumb product={product} size={72} radius={12} />
      </div>
      <div style={{ fontWeight: 700, fontSize: 13.5, textAlign: "center" }}>{prodName(product.name, lang)}</div>
      {productDescription(product, lang) && (
        <div style={{ fontSize: 11, opacity: 0.65, textAlign: "center", lineHeight: 1.4 }}>{productDescription(product, lang)}</div>
      )}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <PriceTag value={effectivePrice(product)} originalValue={effectivePrice(product) !== product.price ? product.price : undefined} unit={product.category === "Gourmet & Gifts" ? undefined : unitName(product.unit, lang)} />
      </div>
      {product.available && hasStockLimit && remaining > 0 && remaining <= 5 && (
        <div style={{ textAlign: "center", fontSize: 11, color: BRAND.orangeDeep, fontWeight: 700 }}>
          {lang === "ar" ? `متبقٍ ${remaining} فقط` : `Only ${remaining} left`}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 }}>
        <Stepper qty={qty} onChange={setQty} disabled={!canOrder} max={hasStockLimit ? remaining : undefined} />
      </div>
      <PrimaryButton
        disabled={!canOrder}
        onClick={() => {
          addToCart({ id: product.id, name: product.name, unit: product.unit, price: effectivePrice(product), qty, kind: "item" });
          setQty(1);
        }}
        style={{ padding: "9px 12px", fontSize: 13 }}
      >
        {cartQty > 0 ? `${t("in_cart")} · ${cartQty}` : soldOut ? (lang === "ar" ? "نفدت الكمية" : "Sold Out") : t("add_to_cart")}
      </PrimaryButton>
    </div>
  );
}

/* ------------------------------------ Boxes ------------------------------------ */

function FreshBoxesView({ products, addToCart, cart, setView, lang, activeCategory, setActiveCategory, onSubmitItemRequest }) {
  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();
  const categories = ["All", ...new Set(products.map((p) => p.category))];
  const selectedCat = activeCategory || "All";
  const filtered = products.filter(
    (p) =>
      p.available &&
      (selectedCat === "All" || p.category === selectedCat) &&
      (!q || p.name.toLowerCase().includes(q) || localName(p.name, lang).includes(search.trim()))
  );
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  return (
    <div style={{ paddingBottom: 110 }}>
      <div style={{ background: `linear-gradient(180deg, ${BRAND.green}, ${BRAND.greenDark})`, margin: "0 -18px", padding: "28px 18px 34px" }}>
        <button onClick={() => setView("home")} style={{ background: "none", border: "none", color: BRAND.cream, display: "flex", alignItems: "center", gap: 6, fontWeight: 700, cursor: "pointer", padding: 0, marginBottom: 18 }}>
          <ArrowLeft size={18} /> {lang === "ar" ? "رجوع" : "Back"}
        </button>
        <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 12, letterSpacing: "0.15em", color: BRAND.gold, fontWeight: 700 }}>
          {lang === "ar" ? "توصيل منزلي" : "HOME DELIVERY"}
        </div>
        <h1 style={{ fontFamily: "Playfair Display, serif", fontStyle: "italic", fontWeight: 700, fontSize: 38, color: "#fff", margin: "8px 0 10px" }}>
          {lang === "ar" ? "توصيل صناديق طازجة" : "Fresh Boxes Delivery"}
        </h1>
        <p style={{ color: BRAND.creamDeep, fontSize: 15, lineHeight: 1.5, maxWidth: 560 }}>
          {lang === "ar"
            ? "اختر حجم الصندوق ووقت التوصيل. منتجات طازجة تصل إلى بابك."
            : "Choose your box size and delivery time. Fresh produce delivered to your door."}
        </p>
      </div>

      <div style={{ paddingTop: 18, display: "grid", gridTemplateColumns: "180px 1fr", gap: 22 }} className="dsf-shop-grid">
        <div className="no-print" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              style={{
                textAlign: "left", background: c === selectedCat ? BRAND.greenSoft : "transparent",
                color: c === selectedCat ? BRAND.green : BRAND.ink, border: "none", borderRadius: 8,
                padding: "9px 12px", fontSize: 13, fontWeight: c === selectedCat ? 700 : 600, cursor: "pointer",
              }}
            >
              {c === "All" ? (lang === "ar" ? "الكل" : "All") : localCategory(c, lang)}
            </button>
          ))}
        </div>

        <div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === "ar" ? "ابحث عن الخضروات…" : "Search vegetables…"}
            style={{ ...inputStyle, marginBottom: 20 }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {filtered.map((p) =>
              p.category === "Gourmet & Gifts"
                ? <GourmetItemCard key={p.id} product={p} addToCart={addToCart} cart={cart} lang={lang} />
                : <BoxSizeCard key={p.id} product={p} addToCart={addToCart} cart={cart} lang={lang} />
            )}
            {filtered.length === 0 && (
              <div style={{ padding: "20px 0" }}>
                <div style={{ opacity: 0.6, fontSize: 14, marginBottom: 12 }}>{lang === "ar" ? "لا توجد نتائج" : "No items found"}</div>
                <ItemRequestForm prefillName={search} onSubmitItemRequest={onSubmitItemRequest} />
              </div>
            )}
          </div>
          {filtered.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <ItemRequestLink onSubmitItemRequest={onSubmitItemRequest} />
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => setView("cart")}
        style={{
          position: "fixed", bottom: 20, insetInlineEnd: 20, background: BRAND.greenDark, color: "#fff",
          border: "none", borderRadius: 999, padding: "14px 22px", display: "flex", alignItems: "center", gap: 10,
          fontWeight: 700, fontSize: 15, boxShadow: "0 8px 24px rgba(0,0,0,0.28)", zIndex: 50, cursor: "pointer",
        }}
      >
        <ShoppingCart size={18} /> {lang === "ar" ? `السلة (${cartCount})` : `Cart (${cartCount})`}
      </button>
    </div>
  );
}

function FruitBoxBuilder({ products, addToCart, cart, setView, lang }) {
  const fruits = products.filter((p) => p.category === "Fruits" && p.available);
  const [qty, setQty] = useState({}); // { productId: count }
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  const total = fruits.reduce((s, p) => s + (qty[p.id] || 0) * effectivePrice(p), 0);
  const pieceCount = Object.values(qty).reduce((s, n) => s + n, 0);

  function setItemQty(id, n) {
    setQty((prev) => ({ ...prev, [id]: Math.max(0, n) }));
  }

  function addAllToCart() {
    fruits.forEach((p) => {
      const n = qty[p.id] || 0;
      if (n > 0) addToCart({ id: p.id, name: p.name, unit: p.unit, price: effectivePrice(p), qty: n, kind: "item" });
    });
    setQty({});
    setView("cart");
  }

  return (
    <div style={{ paddingBottom: 110 }}>
      <div style={{ background: `linear-gradient(180deg, ${BRAND.green}, ${BRAND.greenDark})`, margin: "0 -18px", padding: "28px 18px 34px" }}>
        <button onClick={() => setView("home")} style={{ background: "none", border: "none", color: BRAND.cream, display: "flex", alignItems: "center", gap: 6, fontWeight: 700, cursor: "pointer", padding: 0, marginBottom: 18 }}>
          <ArrowLeft size={18} /> {lang === "ar" ? "رجوع" : "Back"}
        </button>
        <div style={{ fontSize: 26 }}>🍓</div>
        <h1 style={{ fontFamily: "Playfair Display, serif", fontStyle: "italic", fontWeight: 700, fontSize: 32, color: "#fff", margin: "8px 0 10px" }}>
          {lang === "ar" ? "ابنِ صندوق الفواكه الخاص بك" : "Build Your Fruit Box"}
        </h1>
        <p style={{ color: BRAND.creamDeep, fontSize: 14.5, lineHeight: 1.6, maxWidth: 560 }}>
          {lang === "ar"
            ? "اختر عدد القطع التي تريدها من كل فاكهة — تفاحة واحدة، ٣ موز، ٥ برتقال، بالضبط كما تريد."
            : "Choose exactly how many pieces you want of each fruit — 1 apple, 3 bananas, 5 oranges, whatever mix you like."}
        </p>
      </div>

      <div style={{ paddingTop: 20, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px,1fr))", gap: 14 }}>
        {fruits.map((p) => {
          const n = qty[p.id] || 0;
          const existingCartQty = cart.find((c) => c.id === p.id)?.qty || 0;
          const hasStockLimit = typeof p.stock === "number";
          const remaining = hasStockLimit ? Math.max(0, p.stock - existingCartQty) : Infinity;
          const atMax = hasStockLimit && n >= remaining;
          return (
            <div key={p.id} style={{ background: "#fff", border: "1px solid rgba(198,162,76,0.22)", boxShadow: "0 2px 10px rgba(35,31,22,0.05)", borderRadius: 14, padding: 12, textAlign: "center", position: "relative" }}>
              {effectivePrice(p) !== p.price && (
                <div style={{ position: "absolute", top: 8, insetInlineStart: 8, fontSize: 9, fontWeight: 800, letterSpacing: "0.04em", color: "#fff", background: BRAND.tomato, borderRadius: 999, padding: "2px 7px", textTransform: lang === "ar" ? "none" : "uppercase" }}>
                  {lang === "ar" ? "خصم" : "Sale"}
                </div>
              )}
              <Thumb product={p} size={80} radius={10} />
              <div style={{ fontWeight: 700, fontSize: 13, marginTop: 8 }}>{localName(p.name, lang)}</div>
              <div style={{ fontSize: 11.5, opacity: 0.6, marginBottom: 4 }}>
                {effectivePrice(p) !== p.price && (
                  <span style={{ textDecoration: "line-through", opacity: 0.6, marginInlineEnd: 4 }}>{money(p.price)}</span>
                )}
                {money(effectivePrice(p))} / {unitName(p.unit, lang)}
              </div>
              {hasStockLimit && remaining > 0 && remaining <= 5 && (
                <div style={{ fontSize: 10.5, color: BRAND.orangeDeep, fontWeight: 700, marginBottom: 4 }}>
                  {lang === "ar" ? `متبقٍ ${remaining}` : `${remaining} left`}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <button
                  onClick={() => setItemQty(p.id, n - 1)}
                  disabled={n === 0}
                  style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid rgba(198,162,76,0.22)", boxShadow: "0 2px 10px rgba(35,31,22,0.05)", background: "#fff", cursor: n === 0 ? "default" : "pointer", opacity: n === 0 ? 0.4 : 1, fontWeight: 700 }}
                >
                  −
                </button>
                <span style={{ fontWeight: 800, fontSize: 15, minWidth: 18 }}>{n}</span>
                <button
                  onClick={() => !atMax && setItemQty(p.id, n + 1)}
                  disabled={atMax}
                  style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: atMax ? BRAND.creamDeep : BRAND.green, color: "#fff", cursor: atMax ? "default" : "pointer", fontWeight: 700 }}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {pieceCount > 0 && (
        <div
          style={{
            position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: `1px solid ${BRAND.creamDeep}`,
            padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 -6px 20px rgba(0,0,0,0.08)", zIndex: 50,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700 }}>
            {pieceCount} {lang === "ar" ? "قطعة" : "pieces"} · {money(total)}
          </div>
          <PrimaryButton onClick={addAllToCart}>
            {lang === "ar" ? "أضف صندوقي للسلة" : "Add My Box to Cart"} <ChevronRight size={16} />
          </PrimaryButton>
        </div>
      )}

      {pieceCount === 0 && (
        <button
          onClick={() => setView("cart")}
          style={{
            position: "fixed", bottom: 20, insetInlineEnd: 20, background: BRAND.greenDark, color: "#fff",
            border: "none", borderRadius: 999, padding: "14px 22px", display: "flex", alignItems: "center", gap: 10,
            fontWeight: 700, fontSize: 15, boxShadow: "0 8px 24px rgba(0,0,0,0.28)", zIndex: 50, cursor: "pointer",
          }}
        >
          <ShoppingCart size={18} /> {lang === "ar" ? `السلة (${cartCount})` : `Cart (${cartCount})`}
        </button>
      )}
    </div>
  );
}

function VegetableBoxBuilder({ products, addToCart, cart, setView, lang }) {
  const veg = products.filter((p) => p.available && p.category !== "Fruits" && p.category !== "Gourmet & Gifts" && p.category !== "Frozen Foods");
  const [qty, setQty] = useState({}); // { productId: count }
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  const total = veg.reduce((s, p) => s + (qty[p.id] || 0) * effectivePrice(p), 0);
  const pieceCount = Object.values(qty).reduce((s, n) => s + n, 0);

  function setItemQty(id, n) {
    setQty((prev) => ({ ...prev, [id]: Math.max(0, n) }));
  }

  function addAllToCart() {
    veg.forEach((p) => {
      const n = qty[p.id] || 0;
      if (n > 0) addToCart({ id: p.id, name: p.name, unit: p.unit, price: effectivePrice(p), qty: n, kind: "item" });
    });
    setQty({});
    setView("cart");
  }

  return (
    <div style={{ paddingBottom: 110 }}>
      <div style={{ background: `linear-gradient(180deg, ${BRAND.green}, ${BRAND.greenDark})`, margin: "0 -18px", padding: "28px 18px 34px" }}>
        <button onClick={() => setView("home")} style={{ background: "none", border: "none", color: BRAND.cream, display: "flex", alignItems: "center", gap: 6, fontWeight: 700, cursor: "pointer", padding: 0, marginBottom: 18 }}>
          <ArrowLeft size={18} /> {lang === "ar" ? "رجوع" : "Back"}
        </button>
        <div style={{ fontSize: 26 }}>🥬</div>
        <h1 style={{ fontFamily: "Playfair Display, serif", fontStyle: "italic", fontWeight: 700, fontSize: 32, color: "#fff", margin: "8px 0 10px" }}>
          {lang === "ar" ? "ابنِ صندوق الخضروات الخاص بك" : "Build Your Vegetable Box"}
        </h1>
        <p style={{ color: BRAND.creamDeep, fontSize: 14.5, lineHeight: 1.6, maxWidth: 560 }}>
          {lang === "ar"
            ? "اختر الكمية التي تريدها من كل خضار — طماطم، خيار، بصل، بالضبط كما تريد."
            : "Choose exactly how much you want of each vegetable — tomatoes, cucumbers, onions, whatever mix you like."}
        </p>
      </div>

      <div style={{ paddingTop: 20, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px,1fr))", gap: 14 }}>
        {veg.map((p) => {
          const n = qty[p.id] || 0;
          const existingCartQty = cart.find((c) => c.id === p.id)?.qty || 0;
          const hasStockLimit = typeof p.stock === "number";
          const remaining = hasStockLimit ? Math.max(0, p.stock - existingCartQty) : Infinity;
          const atMax = hasStockLimit && n >= remaining;
          return (
            <div key={p.id} style={{ background: "#fff", border: "1px solid rgba(198,162,76,0.22)", boxShadow: "0 2px 10px rgba(35,31,22,0.05)", borderRadius: 14, padding: 12, textAlign: "center", position: "relative" }}>
              {effectivePrice(p) !== p.price && (
                <div style={{ position: "absolute", top: 8, insetInlineStart: 8, fontSize: 9, fontWeight: 800, letterSpacing: "0.04em", color: "#fff", background: BRAND.tomato, borderRadius: 999, padding: "2px 7px", textTransform: lang === "ar" ? "none" : "uppercase" }}>
                  {lang === "ar" ? "خصم" : "Sale"}
                </div>
              )}
              <Thumb product={p} size={80} radius={10} />
              <div style={{ fontWeight: 700, fontSize: 13, marginTop: 8 }}>{localName(p.name, lang)}</div>
              <div style={{ fontSize: 11.5, opacity: 0.6, marginBottom: 4 }}>
                {effectivePrice(p) !== p.price && (
                  <span style={{ textDecoration: "line-through", opacity: 0.6, marginInlineEnd: 4 }}>{money(p.price)}</span>
                )}
                {money(effectivePrice(p))} / {unitName(p.unit, lang)}
              </div>
              {hasStockLimit && remaining > 0 && remaining <= 5 && (
                <div style={{ fontSize: 10.5, color: BRAND.orangeDeep, fontWeight: 700, marginBottom: 4 }}>
                  {lang === "ar" ? `متبقٍ ${remaining}` : `${remaining} left`}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <button
                  onClick={() => setItemQty(p.id, n - 1)}
                  disabled={n === 0}
                  style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid rgba(198,162,76,0.22)", boxShadow: "0 2px 10px rgba(35,31,22,0.05)", background: "#fff", cursor: n === 0 ? "default" : "pointer", opacity: n === 0 ? 0.4 : 1, fontWeight: 700 }}
                >
                  −
                </button>
                <span style={{ fontWeight: 800, fontSize: 15, minWidth: 18 }}>{n}</span>
                <button
                  onClick={() => !atMax && setItemQty(p.id, n + 1)}
                  disabled={atMax}
                  style={{ width: 28, height: 28, borderRadius: "50%", border: "none", background: atMax ? BRAND.creamDeep : BRAND.green, color: "#fff", cursor: atMax ? "default" : "pointer", fontWeight: 700 }}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {pieceCount > 0 && (
        <div
          style={{
            position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: `1px solid ${BRAND.creamDeep}`,
            padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 -6px 20px rgba(0,0,0,0.08)", zIndex: 50,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700 }}>
            {pieceCount} {lang === "ar" ? "عنصر" : "items"} · {money(total)}
          </div>
          <PrimaryButton onClick={addAllToCart}>
            {lang === "ar" ? "أضف صندوقي للسلة" : "Add My Box to Cart"} <ChevronRight size={16} />
          </PrimaryButton>
        </div>
      )}

      {pieceCount === 0 && (
        <button
          onClick={() => setView("cart")}
          style={{
            position: "fixed", bottom: 20, insetInlineEnd: 20, background: BRAND.greenDark, color: "#fff",
            border: "none", borderRadius: 999, padding: "14px 22px", display: "flex", alignItems: "center", gap: 10,
            fontWeight: 700, fontSize: 15, boxShadow: "0 8px 24px rgba(0,0,0,0.28)", zIndex: 50, cursor: "pointer",
          }}
        >
          <ShoppingCart size={18} /> {lang === "ar" ? `السلة (${cartCount})` : `Cart (${cartCount})`}
        </button>
      )}
    </div>
  );
}

function BoxSizeCard({ product, addToCart, cart, lang }) {
  const tiers = computeBoxTiers(product);
  return (
    <div style={{ background: "#fff", border: "1px solid rgba(198,162,76,0.22)", boxShadow: "0 2px 10px rgba(35,31,22,0.05)", borderRadius: 18, overflow: "hidden" }}>
      <div style={{ height: 220, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Thumb product={product} size={220} radius={0} />
      </div>
      <div style={{ padding: 18 }}>
        <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 22, marginBottom: product.origin ? 4 : 12 }}>{localName(product.name, lang)}</div>
        {(product.origin || product.shippingMethod) && (
          <div style={{ fontSize: 11.5, opacity: 0.6, marginBottom: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
            {product.origin && <span>🌍 {lang === "ar" ? `المنشأ: ${product.origin}` : `Origin: ${product.origin}`}</span>}
            {product.shippingMethod && (
              <span>
                {product.shippingMethod === "Air Freight" ? "✈️" : "🚚"}{" "}
                {lang === "ar"
                  ? (product.shippingMethod === "Air Freight" ? "شحن جوي" : "شحن بري")
                  : product.shippingMethod}
              </span>
            )}
          </div>
        )}
        {(lang === "ar" ? product.storageTipAr : product.storageTip) && (
          <div style={{ fontSize: 12, background: BRAND.greenSoft, color: BRAND.green, borderRadius: 8, padding: "8px 10px", marginBottom: 10, lineHeight: 1.5 }}>
            🧊 {lang === "ar" ? product.storageTipAr : product.storageTip}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {tiers.map((tier) => {
            const cartId = `${product.id}-${tier.key}`;
            const inCart = cart.find((c) => c.id === cartId);
            const label = BOX_SIZE_LABEL[tier.key][lang] || BOX_SIZE_LABEL[tier.key].en;
            const weightLabel = lang === "ar" ? tier.weightAr : tier.weight;
            return (
              <button
                key={tier.key}
                onClick={() =>
                  addToCart({
                    id: cartId,
                    name: `${product.name} (${label})`,
                    unit: tier.weight,
                    price: tier.price,
                    qty: 1,
                    kind: "item",
                  })
                }
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  border: `1.5px solid ${inCart ? BRAND.green : BRAND.gold}`,
                  background: inCart ? BRAND.greenSoft : "#fff",
                  borderRadius: 12, padding: "14px 16px", cursor: "pointer", textAlign: "start",
                }}
              >
                <span style={{ fontWeight: 700 }}>
                  {label} <span style={{ fontWeight: 400, opacity: 0.6, fontSize: 12.5 }}>· {weightLabel}</span>
                  {inCart ? <span style={{ color: BRAND.green, fontSize: 12.5 }}> · {inCart.qty} {lang === "ar" ? "في السلة" : "in cart"}</span> : null}
                </span>
                <PriceTag value={tier.price} originalValue={tier.originalPrice} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function GourmetItemCard({ product, addToCart, cart, lang }) {
  const cartQty = cart.find((c) => c.id === product.id)?.qty || 0;
  const hasStockLimit = typeof product.stock === "number";
  const remaining = hasStockLimit ? Math.max(0, product.stock - cartQty) : Infinity;
  const soldOut = hasStockLimit && remaining === 0;
  const canOrder = product.available && !soldOut;
  return (
    <div style={{ background: "#fff", border: "1px solid rgba(198,162,76,0.22)", boxShadow: "0 2px 10px rgba(35,31,22,0.05)", borderRadius: 18, overflow: "hidden", opacity: canOrder ? 1 : 0.6 }}>
      <div style={{ height: 220, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Thumb product={product} size={220} radius={0} />
      </div>
      <div style={{ padding: 18 }}>
        <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 22, marginBottom: 6 }}>{prodName(product.name, lang)}</div>
        {(product.origin || product.shippingMethod) && (
          <div style={{ fontSize: 11.5, opacity: 0.6, marginBottom: 6, display: "flex", gap: 10, flexWrap: "wrap" }}>
            {product.origin && <span>🌍 {lang === "ar" ? `المنشأ: ${product.origin}` : `Origin: ${product.origin}`}</span>}
            {product.shippingMethod && (
              <span>
                {product.shippingMethod === "Air Freight" ? "✈️" : "🚚"}{" "}
                {lang === "ar"
                  ? (product.shippingMethod === "Air Freight" ? "شحن جوي" : "شحن بري")
                  : product.shippingMethod}
              </span>
            )}
          </div>
        )}
        {productDescription(product, lang) && (
          <div style={{ fontSize: 13, opacity: 0.7, lineHeight: 1.5, marginBottom: 12 }}>{productDescription(product, lang)}</div>
        )}
        {hasStockLimit && remaining > 0 && remaining <= 5 && (
          <div style={{ fontSize: 12, color: BRAND.orangeDeep, fontWeight: 700, marginBottom: 8 }}>
            {lang === "ar" ? `متبقٍ ${remaining} فقط` : `Only ${remaining} left`}
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <PriceTag value={effectivePrice(product)} originalValue={effectivePrice(product) !== product.price ? product.price : undefined} size="lg" />
          <PrimaryButton
            disabled={!canOrder}
            onClick={() => addToCart({ id: product.id, name: product.name, unit: product.unit, price: effectivePrice(product), qty: 1, kind: "item" })}
          >
            {soldOut ? (lang === "ar" ? "نفدت الكمية" : "Sold out") : cartQty > 0 ? `${lang === "ar" ? "في السلة" : "In cart"} · ${cartQty}` : (lang === "ar" ? "أضف للسلة" : "Add to cart")}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

function BoxesView({ addToCart, cart, boxes, products }) {
  const { t } = useLang();
  return (
    <div style={{ paddingTop: 22 }}>
      <SectionTitle eyebrow={t("boxes_page_eyebrow")} title={t("boxes_page_title")} />
      <p style={{ opacity: 0.7, fontSize: 14, maxWidth: 560, marginTop: 8 }}>
        {t("boxes_page_sub")}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))", gap: 18, marginTop: 20 }}>
        {boxes.filter((b) => b.available).map((box) => {
          const cartQty = box.customizable
            ? cart.filter((c) => c.id === box.id || c.id.startsWith(`${box.id}-`)).reduce((s, c) => s + c.qty, 0)
            : cart.find((c) => c.id === box.id)?.qty || 0;
          return <BoxCard key={box.id} box={box} addToCart={addToCart} cartQty={cartQty} products={products} cart={cart} />;
        })}
      </div>
    </div>
  );
}

// Single source of truth for which photo a box shows — used by the homepage
// teaser cards and the full Boxes page, so there's only ever one place to
// update when a box's image changes.
function boxPhotoFor(box) {
  return (
    box.id === "box-daily" ? BOX_SMALL_IMG :
    box.id === "box-family" ? BOX_MEDIUM_IMG :
    box.id === "fruit-box-small" ? FRUITBOX_SMALL_IMG :
    box.id === "fruit-box-medium" ? FRUITBOX_MEDIUM_IMG :
    box.id === "fruit-box-large" ? FRUITBOX_LARGE_IMG :
    box.id === "box-kibbeh" ? "/images/box-kibbeh.jpg" :
    box.id === "box-meat-sambousek" ? "/images/box-meat-sambousek.jpg" :
    box.id === "box-cheese-sambousek" ? "/images/box-cheese-sambousek.jpg" :
    box.id === "box-frozen-mix" ? "/images/box-frozen-mix.jpg" :
    BOX_LARGE_IMG
  );
}

function BoxCard({ box, addToCart, cartQty, products, cart }) {
  const { t, lang } = useLang();
  const [qty, setQty] = useState(1);
  const [pickerOpen, setPickerOpen] = useState(false);
  const photo = boxPhotoFor(box);
  const fruits = box.customizable
    ? (products || []).filter((p) => {
        if (!p.available) return false;
        if (box.category === "Fruits") return p.category === "Fruits";
        if (box.category === "Frozen Foods") return p.category === "Frozen Foods";
        // Vegetable boxes: everything that isn't Fruits, Gourmet, or Frozen —
        // spans many sub-categories (Bulbs, Leafy Greens, Herbs, etc.)
        return p.category !== "Fruits" && p.category !== "Gourmet & Gifts" && p.category !== "Frozen Foods";
      })
    : [];
  return (
    <div style={{ background: "#fff", border: "1.5px solid rgba(198,162,76,0.22)", boxShadow: "0 2px 10px rgba(35,31,22,0.05)", borderRadius: 20, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ position: "relative" }}>
        <img src={photo} alt={`${box.name} — Darousha Fresh`} style={{ width: "100%", height: 190, objectFit: "cover", display: "block" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(11,36,23,0.85) 0%, rgba(11,36,23,0.05) 55%)" }} />
        {box.category && (
          <div
            style={{
              position: "absolute", top: 14, right: 14, fontSize: 11, fontWeight: 800,
              letterSpacing: "0.06em", textTransform: lang === "ar" ? "none" : "uppercase",
              color: "#fff",
              background: box.category === "Fruits" ? BRAND.orangeDeep : box.category === "Frozen Foods" ? BRAND.greenDark : BRAND.green,
              border: "1.5px solid rgba(255,255,255,0.7)", borderRadius: 999, padding: "4px 11px",
            }}
          >
            {box.category === "Fruits"
              ? (lang === "ar" ? "🍎 فواكه" : "🍎 Fruits")
              : box.category === "Frozen Foods"
                ? (lang === "ar" ? "❄️ مجمدات" : "❄️ Frozen")
                : (lang === "ar" ? "🥬 خضروات" : "🥬 Vegetables")}
          </div>
        )}
        <div style={{ position: "absolute", left: 18, bottom: 12, color: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, background: BRAND.gold, color: BRAND.greenDark, borderRadius: 999, padding: "3px 10px" }}>{box.weight}</span>
            <span style={{ fontSize: 11, opacity: 0.85, letterSpacing: "0.06em", textTransform: lang === "ar" ? "none" : "uppercase" }}>{box.size}</span>
          </div>
          <div style={{ fontFamily: lang === "ar" ? "Cairo, sans-serif" : "Playfair Display, serif", fontWeight: 800, fontSize: 22 }}>{boxName(box.name, lang)}</div>
        </div>
      </div>
      <div style={{ padding: "14px 22px 0" }}>
        <div style={{ fontSize: 12.5, color: BRAND.orangeDeep, fontWeight: 700 }}>{boxTag(box.tag, lang)}</div>
        <p style={{ fontSize: 13, opacity: 0.8, marginTop: 6 }}>
          {box.customizable
            ? (lang === "ar"
                ? `اختر أي ${box.pieceCount} عنصر من تشكيلة ${box.category === "Fruits" ? "الفواكه" : box.category === "Frozen Foods" ? "المجمدات" : "الخضروات"} لدينا — مزيجك أنت، بنفس السعر الرائع.`
                : `Pick any ${box.pieceCount} items from our ${box.category === "Fruits" ? "fresh fruit" : box.category === "Frozen Foods" ? "frozen" : "fresh produce"} selection — your mix, your box, same great price.`)
            : boxBlurb(box.blurb, lang)}
        </p>
        <div style={{ marginTop: 10 }}>
          <PriceTag value={effectiveBoxPrice(box)} originalValue={effectiveBoxPrice(box) !== box.price ? box.price : undefined} size="lg" />
        </div>
      </div>
      <div style={{ padding: "16px 22px 4px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {box.features.map((f) => (
            <span key={f} style={{ fontSize: 11, background: BRAND.greenSoft, color: BRAND.green, borderRadius: 999, padding: "3px 9px", fontWeight: 600 }}>
              {f}
            </span>
          ))}
        </div>
      </div>
      {box.customizable ? (
        <div style={{ padding: "16px 22px", flex: 1 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: lang === "ar" ? "none" : "uppercase", color: BRAND.green, marginBottom: 8 }}>
            {lang === "ar"
              ? (box.category === "Fruits" ? "أنت تختار الفواكه" : box.category === "Frozen Foods" ? "أنت تختار المجمدات" : "أنت تختار الخضروات")
              : box.category === "Fruits" ? "You choose the fruits" : box.category === "Frozen Foods" ? "You choose the mix" : "You choose the produce"}
          </div>
          <div style={{ fontSize: 13, opacity: 0.75, lineHeight: 1.5 }}>
            {lang === "ar"
              ? `سعر ثابت وعدد عناصر ثابت (${box.pieceCount}) — اختر بنفسك أي مزيج ${box.category === "Fruits" ? "من الفواكه" : box.category === "Frozen Foods" ? "من المجمدات" : "من الخضروات"} المتوفرة.`
              : `Fixed price, fixed count of ${box.pieceCount} items — you pick any mix of ${box.category === "Fruits" ? "fruits" : box.category === "Frozen Foods" ? "frozen items" : "produce"} you like.`}
          </div>
        </div>
      ) : (
        <div style={{ padding: "16px 22px", flex: 1 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: lang === "ar" ? "none" : "uppercase", color: BRAND.green, marginBottom: 8 }}>
            {t("whats_inside")} ({box.includes.length})
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {box.includes.map((n) => (
              <span key={n} style={{ fontSize: 11.5, background: BRAND.cream, border: "1px solid rgba(198,162,76,0.22)", boxShadow: "0 2px 10px rgba(35,31,22,0.05)", borderRadius: 999, padding: "3px 9px" }}>
                {prodName(n, lang)}
              </span>
            ))}
          </div>
        </div>
      )}
      <div style={{ padding: "0 22px 22px", display: "flex", alignItems: "center", gap: 12 }}>
        {box.customizable ? (
          <PrimaryButton full onClick={() => setPickerOpen(true)}>
            {cartQty > 0
              ? `${lang === "ar" ? "أضف مزيجًا آخر" : "Customize Another"} · ${cartQty} ${lang === "ar" ? "في السلة" : "in cart"}`
              : lang === "ar" ? "اختر قطعك وأضف" : "Choose My Pieces"}
            {" "}<ChevronRight size={16} />
          </PrimaryButton>
        ) : (
          <>
            <Stepper qty={qty} onChange={setQty} />
            <PrimaryButton
              full
              onClick={() => {
                addToCart({ id: box.id, name: box.name, unit: "box", price: effectiveBoxPrice(box), qty, kind: "box" });
                setQty(1);
              }}
            >
              {cartQty > 0 ? `${t("in_cart")} · ${cartQty}` : t("add_to_cart")}
            </PrimaryButton>
          </>
        )}
      </div>
      {pickerOpen && (
        <FruitBoxPicker
          box={box}
          fruits={fruits}
          lang={lang}
          cart={cart}
          onClose={() => setPickerOpen(false)}
          onConfirm={(breakdown) => {
            addToCart({
              id: `${box.id}-${Date.now().toString(36)}`,
              name: box.name,
              unit: "box",
              price: effectiveBoxPrice(box),
              qty: 1,
              kind: "box",
              breakdown,
            });
            setPickerOpen(false);
          }}
        />
      )}
    </div>
  );
}

/* Fixed-price, fixed-slot-count box (used for both the fruit boxes and the
   pick-your-own vegetable boxes): the box price and total slot count never
   change — the customer only decides which items fill those slots. */
function FruitBoxPicker({ box, fruits, lang, cart, onClose, onConfirm }) {
  const [qty, setQty] = useState({});
  const stepFor = (id) => {
    const p = fruits.find((f) => f.id === id);
    return p ? boxItemStep(p) : 1;
  };
  // The box has a fixed number of "slots", not a fixed number of physical
  // pieces — a set of 3 apples fills exactly 1 slot, the same as a single
  // dragon fruit, since the box's price is per slot. qty[id] always holds
  // the real physical piece count; this just converts it to slots used.
  const total = Object.entries(qty).reduce((s, [id, n]) => s + n / stepFor(id), 0);
  const remaining = box.pieceCount - total;

  // How many of this item are already spoken for elsewhere in the cart —
  // as a standalone item, or inside another custom box's breakdown —
  // so stock can't be double-booked across the shop and the box picker.
  function committedElsewhere(product) {
    return (cart || []).reduce((sum, item) => {
      if (item.kind === "item" && item.id === product.id) return sum + item.qty;
      if (item.breakdown) {
        const match = item.breakdown.find((b) => b.name === product.name);
        if (match) return sum + match.qty * item.qty;
      }
      return sum;
    }, 0);
  }

  function setItemQty(id, n, product) {
    const clamped = Math.max(0, n);
    const current = qty[id] || 0;
    const delta = clamped - current; // physical pieces
    const step = boxItemStep(product);
    if (delta > 0 && delta / step > remaining) return; // can't exceed the fixed total slots
    if (delta > 0 && typeof product.stock === "number") {
      const stockRemaining = product.stock - committedElsewhere(product) - current;
      if (delta > stockRemaining) return; // can't exceed what's actually in stock
    }
    const perBoxMax = boxItemMaxPerBox(product);
    if (delta > 0 && typeof perBoxMax === "number" && clamped > perBoxMax) return; // premium item — capped regardless of box size
    setQty((prev) => ({ ...prev, [id]: clamped }));
  }

  function handleConfirm() {
    if (Math.round(total) !== box.pieceCount) return;
    const breakdown = fruits
      .map((p) => ({ name: p.name, qty: qty[p.id] || 0 }))
      .filter((b) => b.qty > 0);
    onConfirm(breakdown);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed", inset: 0, background: "rgba(11,36,23,0.55)", zIndex: 200,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 560,
          maxHeight: "88vh", display: "flex", flexDirection: "column", overflow: "hidden",
        }}
      >
        <div style={{ background: `linear-gradient(180deg, ${BRAND.green}, ${BRAND.greenDark})`, padding: "18px 20px", color: "#fff", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontFamily: "Playfair Display, serif", fontStyle: "italic", fontWeight: 700, fontSize: 20 }}>
                {boxName(box.name, lang)}
              </div>
              <div style={{ fontSize: 12.5, opacity: 0.85, marginTop: 3 }}>
                {lang === "ar" ? `اختر ${box.pieceCount} قطعة بالضبط` : `Pick exactly ${box.pieceCount} pieces`}
              </div>
            </div>
            <button onClick={onClose} aria-label="Close" style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%", width: 30, height: 30, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px,1fr))", gap: 12 }}>
            {fruits.map((p) => {
              const n = qty[p.id] || 0;
              const hasStockLimit = typeof p.stock === "number";
              const stockRemaining = hasStockLimit ? Math.max(0, p.stock - committedElsewhere(p) - n) : Infinity;
              const atStockMax = hasStockLimit && stockRemaining < boxItemStep(p);
              const perBoxMax = boxItemMaxPerBox(p);
              const atPerBoxMax = typeof perBoxMax === "number" && n >= perBoxMax;
              const step = boxItemStep(p);
              const plusDisabled = remaining < 1 || atStockMax || atPerBoxMax;
              return (
                <div key={p.id} style={{ background: "#fff", border: "1px solid rgba(198,162,76,0.22)", borderRadius: 16, padding: "14px 10px 12px", textAlign: "center", boxShadow: "0 2px 8px rgba(18,56,34,0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <Thumb product={p} size={60} radius={30} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 12.5, marginTop: 8 }}>{localName(p.name, lang)}</div>
                  {hasStockLimit && stockRemaining > 0 && stockRemaining <= 5 && (
                    <div style={{ fontSize: 10, color: BRAND.orangeDeep, fontWeight: 700, marginTop: 2 }}>
                      {lang === "ar" ? `متبقٍ ${stockRemaining}` : `${stockRemaining} left`}
                    </div>
                  )}
                  {typeof perBoxMax === "number" && (
                    <div style={{ fontSize: 10, color: BRAND.ink, opacity: 0.5, marginTop: 2 }}>
                      {lang === "ar" ? `الحد الأقصى ${perBoxMax} للصندوق` : `Max ${perBoxMax} per box`}
                    </div>
                  )}
                  {step > 1 && (
                    <div style={{ fontSize: 10, color: BRAND.ink, opacity: 0.5, marginTop: 2 }}>
                      {lang === "ar" ? `بمجموعات من ${step}` : `In sets of ${step}`}
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 }}>
                    <button
                      onClick={() => setItemQty(p.id, n - step, p)}
                      disabled={n === 0}
                      style={{ width: 26, height: 26, borderRadius: "50%", border: "1px solid rgba(198,162,76,0.22)", boxShadow: "0 2px 10px rgba(35,31,22,0.05)", background: "#fff", cursor: n === 0 ? "default" : "pointer", opacity: n === 0 ? 0.4 : 1, fontWeight: 700 }}
                    >
                      −
                    </button>
                    <span style={{ fontWeight: 800, fontSize: 14, minWidth: 16 }}>{n}</span>
                    <button
                      onClick={() => setItemQty(p.id, n + step, p)}
                      disabled={plusDisabled}
                      style={{ width: 26, height: 26, borderRadius: "50%", border: "none", background: plusDisabled ? BRAND.creamDeep : BRAND.gold, color: "#fff", cursor: plusDisabled ? "default" : "pointer", fontWeight: 700 }}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
            {fruits.length === 0 && (
              <div style={{ opacity: 0.6, fontSize: 13, padding: "20px 0" }}>
                {lang === "ar" ? "لا توجد فواكه متاحة حاليًا" : "No fruits available right now"}
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: "14px 20px", borderTop: `1px solid ${BRAND.creamDeep}`, flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>
              {Math.round(total)} / {box.pieceCount} {lang === "ar" ? "قطعة محددة" : "pieces selected"}
            </div>
            <div style={{ fontWeight: 800, color: BRAND.green, fontFamily: "IBM Plex Mono, monospace" }}>{money(effectiveBoxPrice(box))}</div>
          </div>
          <div style={{ height: 6, background: BRAND.creamDeep, borderRadius: 999, overflow: "hidden", marginBottom: 14 }}>
            <div style={{ height: "100%", width: `${Math.min(100, (total / box.pieceCount) * 100)}%`, background: BRAND.green, transition: "width 0.15s" }} />
          </div>
          <PrimaryButton full onClick={handleConfirm} disabled={Math.round(total) !== box.pieceCount}>
            {Math.round(total) === box.pieceCount
              ? (lang === "ar" ? "أضف صندوقي للسلة" : "Add My Box to Cart")
              : remaining > 0
                ? (lang === "ar" ? `اختر ${Math.round(remaining)} قطعة أخرى` : `Choose ${Math.round(remaining)} more piece${Math.round(remaining) === 1 ? "" : "s"}`)
                : (lang === "ar" ? "أضف صندوقي للسلة" : "Add My Box to Cart")}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------ Commercial / B2B ------------------------------------ */

function CommercialView({ onSubmitLead }) {
  const { lang } = useLang();
  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [bizType, setBizType] = useState("Restaurant");
  const [volume, setVolume] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const canSubmit = company.trim() && contact.trim() && phone.trim();

  function submit() {
    if (!canSubmit) return;
    onSubmitLead({ company, contact, phone, bizType, volume, message });
    setSent(true);
  }

  // Separate, lightweight lead form for the Office Friday Box pitch — kept
  // apart from the main wholesale form above since the audience (an office
  // manager ordering a weekly team treat) and the info needed (headcount,
  // which day) are different from a restaurant's kitchen volume. Feeds the
  // exact same lead schema/Backstage table as the main form — just tagged
  // with a distinct bizType so it's easy to tell apart in the Leads list.
  const [officeCompany, setOfficeCompany] = useState("");
  const [officeContact, setOfficeContact] = useState("");
  const [officePhone, setOfficePhone] = useState("");
  const [officeHeadcount, setOfficeHeadcount] = useState("");
  const [officeDay, setOfficeDay] = useState("Friday");
  const [officeSent, setOfficeSent] = useState(false);
  const canSubmitOffice = officeCompany.trim() && officeContact.trim() && officePhone.trim();

  function submitOffice() {
    if (!canSubmitOffice) return;
    onSubmitLead({
      company: officeCompany, contact: officeContact, phone: officePhone,
      bizType: "Office Box", volume: officeHeadcount ? `${officeHeadcount} employees` : "",
      headcount: Number(officeHeadcount) || 0,
      message: `Preferred delivery day: ${officeDay}`,
    });
    setOfficeSent(true);
  }

  const isAr = lang === "ar";
  const features = ["Heavy Duty Export Carton", "Batch Number & QR Trace", "Consistent Daily Supply", "Custom Invoicing"];
  const bizTypes = ["Restaurant", "Hotel", "Catering", "Café", "Cloud Kitchen", "Other"];

  const whyItems = [
    { icon: ShieldCheck, t: "Never run out mid-service", b: "Guaranteed daily supply with backup sourcing, so a busy Friday night is never the day you're missing tomatoes." },
    { icon: UserIcon, t: "A dedicated account manager", b: "One direct WhatsApp line to a real person who knows your kitchen — not a ticket queue." },
    { icon: Package, t: "Bulk, wholesale pricing", b: "Volume-based rates that beat retail, with pricing that gets better as your order size grows." },
    { icon: ClipboardList, t: "Full batch traceability", b: "Every carton is batch-numbered and QR-coded — built for HACCP checks and supplier audits, not just a doorstep box." },
    { icon: Clock, t: "Delivery on your schedule", b: "Early-morning or late-night drops, built around your prep times — not a fixed residential delivery window." },
    { icon: CreditCard, t: "Flexible invoicing", b: "Net-15/30 terms available for regular partners, instead of paying cash on delivery every single time." },
  ];

  const tiers = [
    { name: "Boutique Kitchen", vol: "20–60 kg / week", fit: "Cafés, small restaurants, single outlets" },
    { name: "Full-Service Restaurant", vol: "60–200 kg / week", fit: "Restaurants, cloud kitchens, mid-size catering" },
    { name: "Hotel & Bulk Catering", vol: "200+ kg / week", fit: "Hotels, event catering, multi-outlet groups" },
  ];

  const steps = [
    { n: "1", t: "Tell us about your kitchen", b: "Business type, typical volume, and delivery days." },
    { n: "2", t: "Get a custom quote", b: "Wholesale pricing based on your real, ongoing volume." },
    { n: "3", t: "Set your delivery schedule", b: "Recurring drops timed to your prep and service hours." },
    { n: "4", t: "We deliver, you cook", b: "Hand-picked, batch-traced produce — every time." },
  ];

  return (
    <div style={{ paddingTop: 22 }}>
      {/* Hero */}
      <div
        style={{
          background: `linear-gradient(160deg, ${BRAND.green} 0%, ${BRAND.greenDark} 100%)`,
          borderRadius: 24, padding: "40px 30px", color: BRAND.cream, display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr", gap: 24, alignItems: "center", overflow: "hidden",
        }}
        className="dsf-hero"
      >
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.14)", padding: "5px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", marginBottom: 16 }}>
            <Building2 size={13} /> LAUNCHING SOON — B2B & WHOLESALE PROGRAM
          </div>
          <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: 34, lineHeight: 1.15, fontWeight: 800, margin: "0 0 14px" }}>
            Your kitchen's fresh supply,<br /><span style={{ color: BRAND.gold, fontStyle: "italic" }}>handled like a partner.</span>
          </h1>
          <p style={{ fontSize: 15, opacity: 0.88, maxWidth: 460 }}>
            We're building a dedicated wholesale line for hotels, restaurants and catering — bulk, batch-traced produce, hand-selected by our team, priced for real volume, and delivered on your kitchen's schedule.
          </p>
        </div>
        <img src={HOTEL_CARTON_IMG} alt="Darousha Fresh heavy-duty export carton for B2B" style={{ width: "100%", borderRadius: 16, display: "block", boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }} />
      </div>

      {/* Why partner with us */}
      <div style={{ marginTop: 44 }}>
        <SectionTitle eyebrow="Why kitchens choose us" title="Built for how a real kitchen runs" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))", gap: 16, marginTop: 18 }}>
          {whyItems.map((w) => (
            <div key={w.t} style={{ background: "#fff", border: "1px solid rgba(198,162,76,0.22)", boxShadow: "0 2px 10px rgba(35,31,22,0.05)", borderRadius: 16, padding: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: BRAND.greenSoft, display: "flex", alignItems: "center", justifyContent: "center", color: BRAND.green, marginBottom: 12 }}>
                <w.icon size={19} />
              </div>
              <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 15.5, marginBottom: 6 }}>{w.t}</div>
              <div style={{ fontSize: 13, opacity: 0.72, lineHeight: 1.5 }}>{w.b}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 18 }}>
          {features.map((f) => (
            <span key={f} style={{ fontSize: 12, background: BRAND.greenSoft, color: BRAND.green, borderRadius: 999, padding: "5px 11px", fontWeight: 600 }}>{f}</span>
          ))}
        </div>
      </div>

      {/* Office Friday Box */}
      <div
        style={{
          marginTop: 44, background: `linear-gradient(160deg, ${BRAND.greenDark}, ${BRAND.green})`, borderRadius: 24, padding: "36px 30px",
          color: BRAND.cream, display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 28, alignItems: "center", overflow: "hidden",
        }}
        className="dsf-hero"
      >
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.14)", padding: "5px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", marginBottom: 16 }}>
            🍓 OFFICE FRIDAY BOX
          </div>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 26, lineHeight: 1.2, fontWeight: 800, margin: "0 0 12px" }}>
            A fresh fruit box for the whole team, <span style={{ color: BRAND.gold, fontStyle: "italic" }}>every Friday.</span>
          </h2>
          <p style={{ fontSize: 14, opacity: 0.88, maxWidth: 440, marginBottom: 18 }}>
            One recurring order, sized for your headcount, delivered to your office on the same day every week — no reordering, no reminders, just a standing team treat that shows up on time.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, fontSize: 12.5, opacity: 0.85 }}>
            <div>✓ Sized to your team — small office to enterprise floor</div>
            <div>✓ Friday or Monday delivery</div>
            <div>✓ One recurring order, no admin each week</div>
          </div>
        </div>

        {officeSent ? (
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 16, padding: 24, textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Thanks — we'll be in touch shortly to set up your first Friday box.</div>
          </div>
        ) : (
          <div style={{ background: "#fff", borderRadius: 16, padding: 22, color: BRAND.ink }}>
            <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 12 }}>Get a quote for your office</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input value={officeCompany} onChange={(e) => setOfficeCompany(e.target.value)} placeholder="Company name" style={{ ...inputStyle, padding: "9px 12px", fontSize: 13.5 }} />
              <input value={officeContact} onChange={(e) => setOfficeContact(e.target.value)} placeholder="Your name" style={{ ...inputStyle, padding: "9px 12px", fontSize: 13.5 }} />
              <input value={officePhone} onChange={(e) => setOfficePhone(e.target.value)} placeholder="Phone / WhatsApp" style={{ ...inputStyle, padding: "9px 12px", fontSize: 13.5 }} />
              <input value={officeHeadcount} onChange={(e) => setOfficeHeadcount(e.target.value)} placeholder="Roughly how many employees?" style={{ ...inputStyle, padding: "9px 12px", fontSize: 13.5 }} />
              <div style={{ display: "flex", gap: 8 }}>
                {["Friday", "Monday"].map((d) => (
                  <button
                    key={d}
                    onClick={() => setOfficeDay(d)}
                    style={{
                      flex: 1, padding: "9px 0", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer",
                      border: `1.5px solid ${officeDay === d ? BRAND.green : BRAND.creamDeep}`,
                      background: officeDay === d ? BRAND.greenSoft : "#fff", color: officeDay === d ? BRAND.green : BRAND.ink,
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <PrimaryButton full disabled={!canSubmitOffice} onClick={submitOffice} style={{ marginTop: 14, padding: "11px 0" }}>
              Request a quote
            </PrimaryButton>
          </div>
        )}
      </div>

      {/* How it works */}
      <div style={{ marginTop: 48 }}>
        <SectionTitle eyebrow="Getting started" title="From first message to first delivery" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: 16, marginTop: 18 }}>
          {steps.map((s) => (
            <div key={s.n} style={{ background: "#fff", border: "1px solid rgba(198,162,76,0.22)", boxShadow: "0 2px 10px rgba(35,31,22,0.05)", borderRadius: 16, padding: 18 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: BRAND.green, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, marginBottom: 10 }}>{s.n}</div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{s.t}</div>
              <div style={{ fontSize: 12.5, opacity: 0.68, lineHeight: 1.5 }}>{s.b}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Volume tiers */}
      <div style={{ marginTop: 48 }}>
        <SectionTitle eyebrow="Sized to your business" title="Wholesale volume tiers" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 16, marginTop: 18 }}>
          {tiers.map((t) => (
            <div key={t.name} style={{ background: "#fff", border: "1px solid rgba(198,162,76,0.22)", boxShadow: "0 2px 10px rgba(35,31,22,0.05)", borderRadius: 16, padding: 20 }}>
              <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 17 }}>{t.name}</div>
              <div style={{ fontSize: 12.5, color: BRAND.orangeDeep, fontWeight: 700, marginTop: 6 }}>{t.vol}</div>
              <div style={{ fontSize: 12.5, opacity: 0.68, marginTop: 8, lineHeight: 1.5 }}>{t.fit}</div>
              <div style={{ marginTop: 12, fontSize: 12, fontWeight: 700, color: BRAND.green }}>Early access →</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, opacity: 0.55, marginTop: 12 }}>We're onboarding our first wholesale partners now — join early access below and we'll follow up personally with pricing as we launch.</p>
      </div>

      {/* Lead form */}
      <div style={{ marginTop: 48, background: "#fff", border: "1px solid rgba(198,162,76,0.22)", boxShadow: "0 2px 10px rgba(35,31,22,0.05)", borderRadius: 20, padding: 28, maxWidth: 620, marginLeft: "auto", marginRight: "auto" }}>
        {sent ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <CheckCircle2 size={34} color={BRAND.green} style={{ marginBottom: 10 }} />
            <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 19, marginBottom: 6 }}>You're on the launch list</div>
            <p style={{ fontSize: 13.5, opacity: 0.7 }}>We'll reach out to you personally as soon as commercial ordering opens, with early wholesale pricing for {company || "your business"}.</p>
          </div>
        ) : (
          <>
            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 22 }}>Become a launch partner</div>
              <p style={{ fontSize: 13, opacity: 0.65, marginTop: 4 }}>Tell us about your kitchen — we'll reach out personally as we onboard our first wholesale partners.</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Field label="Business name"><input style={inputStyle} value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Marina Grill Restaurant" /></Field>
              <Field label="Business type">
                <select style={inputStyle} value={bizType} onChange={(e) => setBizType(e.target.value)}>
                  {bizTypes.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </Field>
              <Field label="Contact name"><input style={inputStyle} value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Your name" /></Field>
              <Field label="Phone number"><input style={inputStyle} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+971 5xx xxx xxx" /></Field>
              <Field label="Estimated weekly volume (optional)"><input style={inputStyle} value={volume} onChange={(e) => setVolume(e.target.value)} placeholder="e.g. 80 kg / week" /></Field>
              <Field label="Anything else? (optional)">
                <textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Delivery days, specific produce needs, current supplier pain points…" />
              </Field>
            </div>
            <PrimaryButton full disabled={!canSubmit} onClick={submit} style={{ marginTop: 18 }}>
              Request early access
            </PrimaryButton>
            <p style={{ fontSize: 11.5, opacity: 0.5, textAlign: "center", marginTop: 10 }}>Or WhatsApp us directly: {formatPhoneDisplay(WHATSAPP_NUMBER)}</p>
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------ Cart ------------------------------------ */

function CartView({ cart, setCartQty, removeFromCart, subtotal, deliveryFee, vat, discount, total, setView, promoInput, setPromoInput, appliedPromo, promoError, applyPromoCode, removePromoCode, products, addToCart, pointsBalance, pointsToRedeem, setPointsToRedeem, pointsDiscount, user }) {
  const { t, lang } = useLang();
  const addOnProducts = (products || []).filter((p) => p.category === "Gourmet & Gifts" && p.available);
  const cartIds = new Set(cart.map((i) => i.id));
  if (cart.length === 0) {
    return (
      <div style={{ paddingTop: 60, textAlign: "center" }}>
        <ShoppingCart size={40} color={BRAND.green} style={{ opacity: 0.4 }} />
        <h2 style={{ fontFamily: lang === "ar" ? "Cairo, sans-serif" : "Playfair Display, serif" }}>{t("cart_empty")}</h2>
        <p style={{ opacity: 0.65, marginBottom: 20 }}>{t("cart_empty_sub")}</p>
        <PrimaryButton onClick={() => setView("boxes")}>{t("browse_shop")}</PrimaryButton>
      </div>
    );
  }
  return (
    <div style={{ paddingTop: 22 }}>
      <SectionTitle eyebrow={t("cart_eyebrow")} title={t("cart_title")} />
      <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
        {cart.map((item) => (
          <div key={item.id} style={{ background: "#fff", border: "1px solid rgba(198,162,76,0.22)", boxShadow: "0 2px 10px rgba(35,31,22,0.05)", borderRadius: 14, padding: 14, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: BRAND.greenSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {item.kind === "box" ? <Package size={20} color={BRAND.green} /> : <Thumb product={item} size={40} radius={8} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{item.kind === "box" ? boxName(item.name, lang) : prodName(item.name, lang)}</div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>
                {money(item.price)}
                {(products || []).find((p) => p.id === item.id)?.category !== "Gourmet & Gifts" && ` / ${unitName(item.unit, lang)}`}
              </div>
              {item.breakdown && item.breakdown.length > 0 && (
                <div style={{ fontSize: 11.5, opacity: 0.65, marginTop: 2 }}>
                  {breakdownText(item, lang)}
                  <span style={{ fontWeight: 700 }}>
                    {" "}— {breakdownTotalPieces(item) * item.qty} {lang === "ar" ? "قطعة بالإجمالي" : "pieces total"}
                  </span>
                </div>
              )}
            </div>
            <Stepper qty={item.qty} onChange={(q) => setCartQty(item.id, q)} />
            <div style={{ fontFamily: "IBM Plex Mono, monospace", fontWeight: 700, minWidth: 70, textAlign: "right" }}>{money(item.qty * item.price)}</div>
            <button onClick={() => removeFromCart(item.id)} style={{ background: "none", border: "none", color: BRAND.tomato, cursor: "pointer" }} aria-label="Remove">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {addOnProducts.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ fontFamily: lang === "ar" ? "Cairo, sans-serif" : "Playfair Display, serif", fontWeight: 700, fontSize: 16, marginBottom: 10 }}>
            {lang === "ar" ? "أكمل طلبك" : "Complete your order"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {addOnProducts.map((p) => {
              const hasStockLimit = typeof p.stock === "number";
              const soldOut = hasStockLimit && p.stock <= 0;
              return (
                <div key={p.id} style={{ background: "#fff", border: "1px solid rgba(198,162,76,0.22)", boxShadow: "0 2px 10px rgba(35,31,22,0.05)", borderRadius: 14, padding: 12, display: "flex", alignItems: "center", gap: 12, opacity: soldOut ? 0.5 : 1 }}>
                  <Thumb product={p} size={48} radius={10} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>{prodName(p.name, lang)}</div>
                    <div style={{ fontSize: 12, opacity: 0.65, fontFamily: "IBM Plex Mono, monospace", marginTop: 2 }}>
                      {effectivePrice(p) !== p.price && (
                        <span style={{ textDecoration: "line-through", opacity: 0.6, marginInlineEnd: 4 }}>{money(p.price)}</span>
                      )}
                      {money(effectivePrice(p))}
                    </div>
                  </div>
                  <GhostButton
                    disabled={soldOut}
                    style={{ padding: "7px 14px", fontSize: 12.5, opacity: soldOut ? 0.5 : 1 }}
                    onClick={() => addToCart({ id: p.id, name: p.name, unit: p.unit, price: effectivePrice(p), qty: 1, kind: "item" })}
                  >
                    {soldOut ? (lang === "ar" ? "نفدت الكمية" : "Sold out") : cartIds.has(p.id) ? (lang === "ar" ? "أضيف ✓" : "Added ✓") : (lang === "ar" ? "أضف" : "Add")}
                  </GhostButton>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ marginTop: 22, background: "#fff", border: "1px solid rgba(198,162,76,0.22)", boxShadow: "0 2px 10px rgba(35,31,22,0.05)", borderRadius: 14, padding: 18, maxWidth: 360, marginLeft: "auto" }}>
        {appliedPromo ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: BRAND.greenSoft, borderRadius: 8, padding: "8px 10px", marginBottom: 12, fontSize: 12.5 }}>
            <span style={{ color: BRAND.green, fontWeight: 700 }}>🏷 {appliedPromo.code} — {appliedPromo.label}</span>
            <button onClick={removePromoCode} style={{ background: "none", border: "none", color: BRAND.tomato, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
              {lang === "ar" ? "إزالة" : "Remove"}
            </button>
          </div>
        ) : (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                placeholder={lang === "ar" ? "كود خصم أو إحالة" : "Promo or referral code"}
                style={{ ...inputStyle, flex: 1, padding: "8px 10px", fontSize: 12.5 }}
              />
              <GhostButton style={{ padding: "8px 14px", fontSize: 12.5 }} onClick={() => applyPromoCode(promoInput)}>
                {lang === "ar" ? "تطبيق" : "Apply"}
              </GhostButton>
            </div>
            {promoError && <div style={{ fontSize: 11.5, color: BRAND.tomato, marginTop: 5 }}>{promoError}</div>}
          </div>
        )}
        {user && pointsBalance > 0 && (
          <div style={{ background: BRAND.greenSoft, borderRadius: 8, padding: "10px 10px", marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5 }}>
              <span>
                ⭐ {lang === "ar" ? `لديك ${pointsBalance} نقطة` : `You have ${pointsBalance} points`}
                <span style={{ opacity: 0.65 }}> ({lang === "ar" ? "نقطة = 1 درهم" : "1 point = AED 1"})</span>
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              <input
                type="range"
                min="0"
                max={Math.min(pointsBalance, Math.max(0, subtotal - discount))}
                value={pointsToRedeem}
                onChange={(e) => setPointsToRedeem(Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <span style={{ fontWeight: 700, fontSize: 12.5, minWidth: 70, textAlign: "right" }}>
                {lang === "ar" ? `استخدام ${pointsDiscount}` : `Use ${pointsDiscount}`}
              </span>
            </div>
          </div>
        )}
        <Row label={t("subtotal")} value={money(subtotal)} />
        {discount > 0 && <Row label={lang === "ar" ? "الخصم" : "Discount"} value={`-${money(discount)}`} />}
        {pointsDiscount > 0 && <Row label={lang === "ar" ? "نقاط الولاء" : "Loyalty points"} value={`-${money(pointsDiscount)}`} />}
        <Row label={t("delivery_fee")} value={deliveryFee === 0 ? t("free") : money(deliveryFee)} />
        {deliveryFee > 0 && <div style={{ fontSize: 11.5, opacity: 0.6, marginBottom: 8 }}>{t("free_delivery_note")} {money(FREE_DELIVERY_OVER)}</div>}
        <Row label={t("vat_label")} value={money(vat)} />
        <hr style={{ border: "none", borderTop: `1px dashed ${BRAND.creamDeep}`, margin: "10px 0" }} />
        <Row label={t("total")} value={money(total)} bold />
        <PrimaryButton full onClick={() => setView("checkout")} style={{ marginTop: 14 }}>
          {t("proceed_checkout")} <ChevronRight size={16} />
        </PrimaryButton>
      </div>
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: bold ? 16 : 13.5, fontWeight: bold ? 800 : 500, marginBottom: 4 }}>
      <span>{label}</span>
      <span style={{ fontFamily: "IBM Plex Mono, monospace" }}>{value}</span>
    </div>
  );
}

/* ------------------------------------ Checkout ------------------------------------ */

function LocationPicker({ geo, setGeo, lang }) {
  const leafletReady = useLeaflet();
  const googleReady = useGoogleMaps();
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);
  const searchInputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [geoStatus, setGeoStatus] = useState("idle"); // idle | loading | granted | denied | timeout | error
  const debounceRef = useRef(null);

  const DUBAI_CENTER = [25.2048, 55.2708];

  // init the map once Leaflet has loaded
  useEffect(() => {
    if (!leafletReady || !mapRef.current || mapInstance.current) return;
    const L = window.L;
    const start = geo ? [geo.lat, geo.lng] : DUBAI_CENTER;
    const map = L.map(mapRef.current).setView(start, 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);
    const marker = L.marker(start, { draggable: true }).addTo(map);
    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      setGeo({ lat: pos.lat, lng: pos.lng });
    });
    map.on("click", (e) => {
      marker.setLatLng(e.latlng);
      setGeo({ lat: e.latlng.lat, lng: e.latlng.lng });
    });
    mapInstance.current = map;
    markerInstance.current = marker;
    setTimeout(() => map.invalidateSize(), 200);
  }, [leafletReady]);

  // keep the marker/map in sync if geo changes from outside (GPS button, search result)
  useEffect(() => {
    if (!mapInstance.current || !markerInstance.current || !geo) return;
    markerInstance.current.setLatLng([geo.lat, geo.lng]);
    mapInstance.current.setView([geo.lat, geo.lng], 16);
  }, [geo]);

  // Google Places Autocomplete — binds directly to the search input for far
  // better building/POI name coverage than the free OpenStreetMap search.
  useEffect(() => {
    if (!googleReady || !searchInputRef.current || autocompleteRef.current) return;
    const ac = new window.google.maps.places.Autocomplete(searchInputRef.current, {
      componentRestrictions: { country: "ae" },
      fields: ["geometry", "formatted_address", "name"],
    });
    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      if (!place.geometry) return;
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      setGeo({ lat, lng });
      setQuery(place.formatted_address || place.name || "");
    });
    autocompleteRef.current = ac;
  }, [googleReady]);

  function shareLocation() {
    if (!navigator.geolocation) {
      setGeoStatus("error");
      return;
    }
    setGeoStatus("loading");

    function onError(err) {
      // Code 1 = PERMISSION_DENIED (they said no — nothing else to try).
      // Code 2/3 = POSITION_UNAVAILABLE / TIMEOUT — often just a slow GPS
      // fix (common indoors), so retry once with network-based location,
      // which is far faster even though less precise.
      if (err && err.code === 1) {
        setGeoStatus("denied");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGeoStatus("granted");
        },
        () => setGeoStatus("timeout"),
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
      );
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus("granted");
      },
      onError,
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  // Fallback search (only used when Google Places isn't configured)
  function handleQueryChange(v) {
    setQuery(v);
    if (googleReady) return; // Google's own dropdown handles suggestions
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (v.trim().length < 3) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=ae&limit=5&q=${encodeURIComponent(v)}`;
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        const data = await res.json();
        setResults(data || []);
      } catch {
        setResults([]);
      }
      setSearching(false);
    }, 450);
  }

  function pickResult(r) {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    setGeo({ lat, lng });
    setQuery(r.display_name);
    setResults([]);
  }

  return (
    <div style={{ marginTop: -8, marginBottom: 14 }}>
      <div style={{ position: "relative" }}>
        <input
          ref={searchInputRef}
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder={lang === "ar" ? "ابحث عن اسم المبنى أو المنطقة…" : "Search building name or area…"}
          style={inputStyle}
        />
        {results.length > 0 && (
          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid rgba(198,162,76,0.22)", borderRadius: 10, marginTop: 4, zIndex: 20, boxShadow: "0 8px 20px rgba(0,0,0,0.12)", maxHeight: 220, overflowY: "auto" }}>
            {results.map((r) => (
              <div
                key={r.place_id}
                onClick={() => pickResult(r)}
                style={{ padding: "10px 12px", fontSize: 12.5, cursor: "pointer", borderBottom: `1px solid ${BRAND.creamDeep}` }}
              >
                {r.display_name}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
        <button
          type="button"
          onClick={shareLocation}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6, background: geoStatus === "granted" ? BRAND.greenSoft : "#fff",
            color: BRAND.green, border: `1px solid ${BRAND.green}`, borderRadius: 999,
            padding: "7px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer",
          }}
        >
          <MapPin size={13} />
          {geoStatus === "loading" ? t_geo(lang, "loading") : geoStatus === "granted" ? t_geo(lang, "shared") : t_geo(lang, "share")}
        </button>
        {searching && <span style={{ fontSize: 11.5, opacity: 0.6 }}>{lang === "ar" ? "جارٍ البحث…" : "Searching…"}</span>}
      </div>
      {geoStatus === "denied" && <div style={{ fontSize: 11.5, color: BRAND.tomato, marginTop: 6 }}>{t_geo(lang, "denied")}</div>}
      {geoStatus === "timeout" && <div style={{ fontSize: 11.5, color: BRAND.tomato, marginTop: 6 }}>{t_geo(lang, "timeout")}</div>}

      <div ref={mapRef} style={{ width: "100%", height: 220, borderRadius: 12, marginTop: 10, border: "1px solid rgba(198,162,76,0.22)", boxShadow: "0 2px 10px rgba(35,31,22,0.05)" }} />
      <div style={{ fontSize: 11, opacity: 0.55, marginTop: 6 }}>
        {lang === "ar" ? "اسحب الدبوس لضبط موقعك بدقة، أو اضغط على الخريطة." : "Drag the pin to fine-tune your exact spot, or tap the map."}
      </div>
    </div>
  );
}
function t_geo(lang, key) {
  const map = {
    loading: { en: "Getting your location…", ar: "جارٍ تحديد موقعك…" },
    shared: { en: "Location set ✓", ar: "تم تحديد الموقع ✓" },
    share: { en: "Use my GPS location", ar: "استخدم موقعي عبر GPS" },
    denied: { en: "Location wasn't shared — search or drag the pin instead.", ar: "لم تتم مشاركة الموقع — ابحث أو اسحب الدبوس بدلاً من ذلك." },
    timeout: { en: "Couldn't get a GPS fix — try again near a window, or just search/drag the pin instead.", ar: "تعذّر تحديد الموقع عبر GPS — حاول مجددًا قرب نافذة، أو ابحث أو اسحب الدبوس بدلاً من ذلك." },
  };
  return map[key][lang] || map[key].en;
}

function CheckoutSignInGate({ setView }) {
  const { t } = useLang();
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  return (
    <div style={{ paddingTop: 40, maxWidth: 380, margin: "0 auto" }}>
      <button onClick={() => setView("cart")} style={backLinkStyle}><ArrowLeft size={15} /> Back to cart</button>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 14, marginTop: 10 }}>
        <UserIcon size={30} color={BRAND.green} />
      </div>
      <SectionTitle eyebrow="One quick step" title="Sign in to check out" />
      <p style={{ fontSize: 13.5, opacity: 0.7, marginTop: 10 }}>
        Create an account (or sign back in) to place your order — it saves your details for next time and lets you track every order from one place.
      </p>
      <div style={{ display: "flex", gap: 8, margin: "16px 0" }}>
        <Pill active={mode === "signin"} onClick={() => setMode("signin")}>Sign in</Pill>
        <Pill active={mode === "signup"} onClick={() => setMode("signup")}>Sign up</Pill>
      </div>
      {mode === "signin" ? <SignInForm /> : <SignUpForm />}
    </div>
  );
}

function CheckoutView({ cart, subtotal, deliveryFee, vat, discount, appliedPromo, total, onPlaceOrder, setView, profile, pointsDiscount, pointsToEarn }) {
  const { t, lang } = useLang();
  const [name, setName] = useState(profile?.name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [address, setAddress] = useState(profile?.address || "");
  const [area, setArea] = useState(profile?.area || AREAS[0]);
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState(TIME_SLOTS[0]);
  const [payment, setPayment] = useState("cod");
  const [card, setCard] = useState({ number: "", exp: "", cvc: "" });
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState(null);
  const [geo, setGeo] = useState(null); // { lat, lng } once set via search, GPS, or map pin
  const [leaveAtDoor, setLeaveAtDoor] = useState(false);
  const [subscribeWeekly, setSubscribeWeekly] = useState(false);
  const [subscriptionFrequency, setSubscriptionFrequency] = useState("weekly");
  const [isGift, setIsGift] = useState(false);
  const [giftRecipientName, setGiftRecipientName] = useState("");
  const [giftNote, setGiftNote] = useState("");

  const canSubmit = name.trim() && phone.trim() && address.trim() && date;

  useEffect(() => {
    if (!profile) return;
    setName((v) => v || profile.name || "");
    setPhone((v) => v || profile.phone || "");
    setAddress((v) => v || profile.address || "");
    setArea((v) => (v && v !== AREAS[0] ? v : profile.area || v));
  }, [profile]);

  async function submit() {
    if (!canSubmit) return;
    const isToday = date === localDateISO();
    const nowHour = new Date().getHours() + new Date().getMinutes() / 60;
    if (isToday && TIME_SLOT_END_HOUR[slot] <= nowHour) {
      setPlaceError({ reason: "stale-slot" });
      return;
    }
    const order = {
      id: genOrderId(),
      createdAt: new Date().toISOString(),
      customer: {
        name, phone, address, area, date, slot, payment, leaveAtDoor, subscribeWeekly,
        ...(subscribeWeekly ? { subscriptionFrequency } : {}),
        ...(geo ? { lat: geo.lat, lng: geo.lng } : {}),
        ...(isGift ? { isGift: true, giftRecipientName: giftRecipientName.trim(), giftNote: giftNote.trim() } : {}),
      },
      items: cart,
      subtotal,
      discount,
      promoCode: appliedPromo ? appliedPromo.code : null,
      referralCodeUsed: appliedPromo && appliedPromo.isReferral ? appliedPromo.code : null,
      pointsRedeemed: pointsDiscount || 0,
      pointsEarned: pointsToEarn || 0,
      deliveryFee,
      vat,
      total,
      status: "placed",
    };
    setPlacing(true);
    setPlaceError(null);
    const result = await onPlaceOrder(order);
    setPlacing(false);
    if (result !== true) setPlaceError(result);
  }

  return (
    <div style={{ paddingTop: 22 }}>
      <button onClick={() => setView("cart")} style={backLinkStyle}><ArrowLeft size={15} /> {t("back_to_cart")}</button>
      <SectionTitle eyebrow={t("checkout_eyebrow")} title={t("checkout_title")} />

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.9fr", gap: 22, marginTop: 18, alignItems: "start" }} className="dsf-checkout-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <FormCard title={t("delivery_info")} icon={MapPin}>
            <Field label={t("full_name")}><input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" /></Field>
            <Field label={t("phone_number")}><input style={inputStyle} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+971 5xx xxx xxx" /></Field>
            <Field label={t("delivery_address")}><input style={inputStyle} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, building, apartment" /></Field>
            <div style={{ marginTop: -8, marginBottom: 12 }}>
              <LocationPicker geo={geo} setGeo={setGeo} lang={lang} />
            </div>
            <Field label={t("area")}>
              <select style={inputStyle} value={area} onChange={(e) => setArea(e.target.value)}>
                {AREAS.map((a) => <option key={a} value={a}>{localArea(a, lang)}</option>)}
              </select>
            </Field>
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, fontSize: 13, cursor: "pointer" }}>
              <input type="checkbox" checked={leaveAtDoor} onChange={(e) => setLeaveAtDoor(e.target.checked)} style={{ width: 16, height: 16 }} />
              {t("leave_at_door")}
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontSize: 13, cursor: "pointer" }}>
              <input type="checkbox" checked={isGift} onChange={(e) => setIsGift(e.target.checked)} style={{ width: 16, height: 16 }} />
              🎁 {lang === "ar" ? "هذا طلب هدية" : "This is a gift"}
            </label>
            {isGift && (
              <div style={{ marginTop: 10, background: BRAND.creamDeep + "55", borderRadius: 10, padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                <Field label={lang === "ar" ? "اسم المستلم (اختياري)" : "Recipient's name (optional)"}>
                  <input
                    type="text"
                    value={giftRecipientName}
                    onChange={(e) => setGiftRecipientName(e.target.value)}
                    placeholder={lang === "ar" ? "إن كان مختلفًا عن اسم الطلب" : "If different from the order name"}
                    style={inputStyle}
                  />
                </Field>
                <Field label={lang === "ar" ? "رسالة الهدية (اختياري)" : "Gift note (optional)"}>
                  <textarea
                    value={giftNote}
                    onChange={(e) => setGiftNote(e.target.value)}
                    placeholder={lang === "ar" ? "اكتب رسالتك هنا — سنطبعها على بطاقة مرفقة بالطلب" : "Write your message — we'll include it on a card with the delivery"}
                    rows={3}
                    style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
                  />
                </Field>
                <div style={{ fontSize: 11.5, opacity: 0.65 }}>
                  {lang === "ar" ? "سيتم تنبيه فريق التوصيل بأن هذا طلب هدية." : "We'll let our delivery team know this order is a gift."}
                </div>
              </div>
            )}
            {cart.some((c) => c.kind === "box") && (
              <div style={{ marginTop: 10, background: BRAND.greenSoft, borderRadius: 10, padding: 10 }}>
                <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, cursor: "pointer" }}>
                  <input type="checkbox" checked={subscribeWeekly} onChange={(e) => setSubscribeWeekly(e.target.checked)} style={{ width: 16, height: 16, marginTop: 2 }} />
                  <span>
                    <b style={{ color: BRAND.green }}>{lang === "ar" ? "الاشتراك والتوفير" : "Subscribe & Save"}</b>
                    <br />
                    <span style={{ opacity: 0.75 }}>
                      {lang === "ar"
                        ? "أعيدي طلب هذا الصندوق تلقائيًا حسب الجدول الذي تختارينه — لا حاجة لإعادة الطلب يدويًا. الدفع نقدًا عند التوصيل كالمعتاد."
                        : "Automatically re-order this box on a schedule you choose — no need to re-order manually each time. Paid by cash on delivery each time, same as normal."}
                    </span>
                  </span>
                </label>
                {subscribeWeekly && (
                  <div style={{ display: "flex", gap: 8, marginTop: 10, marginInlineStart: 24, flexWrap: "wrap" }}>
                    {["weekly", "biweekly", "monthly"].map((f) => (
                      <Pill key={f} active={subscriptionFrequency === f} onClick={() => setSubscriptionFrequency(f)}>
                        {{ weekly: lang === "ar" ? "أسبوعيًا" : "Weekly", biweekly: lang === "ar" ? "كل أسبوعين" : "Every 2 weeks", monthly: lang === "ar" ? "شهريًا" : "Monthly" }[f]}
                      </Pill>
                    ))}
                  </div>
                )}
              </div>
            )}
          </FormCard>

          <FormCard title={t("delivery_datetime")} icon={Clock}>
            <Field label={t("delivery_date")}>
              <input
                type="date"
                style={inputStyle}
                value={date}
                min={localDateISO()}
                onChange={(e) => {
                  // Can't pick a slot that's already elapsed for the new date
                  const isToday = e.target.value === localDateISO();
                  const nowHour = new Date().getHours() + new Date().getMinutes() / 60;
                  if (isToday && TIME_SLOT_END_HOUR[slot] <= nowHour) setSlot("");
                  setDate(e.target.value);
                }}
              />
            </Field>
            <Field label={t("time_slot")}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {TIME_SLOTS.map((s) => {
                  const isToday = date === localDateISO();
                  const nowHour = new Date().getHours() + new Date().getMinutes() / 60;
                  const elapsed = isToday && TIME_SLOT_END_HOUR[s] <= nowHour;
                  return (
                    <Pill key={s} active={slot === s} onClick={() => setSlot(s)} disabled={elapsed}>
                      {localSlot(s, lang)}{elapsed ? ` (${lang === "ar" ? "انتهى" : "passed"})` : ""}
                    </Pill>
                  );
                })}
              </div>
            </Field>
          </FormCard>

          <FormCard title={t("payment_method")} icon={CreditCard}>
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <Pill active={payment === "cod"} onClick={() => setPayment("cod")}><Banknote size={13} style={{ marginRight: 4 }} />{t("cod")}</Pill>
              <Pill active={payment === "card"} onClick={() => setPayment("card")}><CreditCard size={13} style={{ marginRight: 4 }} />{t("card")}</Pill>
            </div>
            {payment === "card" && (
              <div>
                <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 10, display: "flex", gap: 6, alignItems: "center" }}>
                  <ShieldCheck size={13} /> {t("demo_notice")}
                </div>
                <Field label={t("card_number")}><input style={inputStyle} value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} placeholder="4242 4242 4242 4242" /></Field>
                <div style={{ display: "flex", gap: 10 }}>
                  <Field label={t("expiry")}><input style={inputStyle} value={card.exp} onChange={(e) => setCard({ ...card, exp: e.target.value })} placeholder="MM/YY" /></Field>
                  <Field label={t("cvc")}><input style={inputStyle} value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value })} placeholder="123" /></Field>
                </div>
              </div>
            )}
          </FormCard>
        </div>

        <div style={{ background: BRAND.greenDark, color: BRAND.cream, borderRadius: 16, padding: 22, position: "sticky", top: 90, boxShadow: "0 12px 30px rgba(11,36,23,0.28)" }}>
          <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 19, marginBottom: 16 }}>{t("order_summary")}</div>
          <Row label={t("subtotal")} value={money(subtotal)} />
          {discount > 0 && <Row label={lang === "ar" ? "الخصم" : "Discount"} value={`-${money(discount)}`} />}
          <Row label={t("delivery_fee")} value={deliveryFee === 0 ? t("free") : money(deliveryFee)} />
          <Row label={t("vat_label")} value={money(vat)} />
          <hr style={{ border: "none", borderTop: `1px dashed rgba(247,241,228,0.28)`, margin: "12px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
            <span>{t("total")}</span>
            <span style={{ fontFamily: "IBM Plex Mono, monospace", color: BRAND.orange }}>{money(total)}</span>
          </div>
          <PrimaryButton
            full
            disabled={!canSubmit || placing}
            onClick={submit}
            style={{ marginTop: 18, background: (!canSubmit || placing) ? "#C9C2B2" : BRAND.orange, color: BRAND.ink, boxShadow: "none" }}
          >
            {placing ? t("placing_order") : `${t("place_order")} · ${money(total)}`}
          </PrimaryButton>
          {!canSubmit && <div style={{ fontSize: 11.5, opacity: 0.65, marginTop: 8 }}>{t("fill_fields")}</div>}
          {placeError && (
            <div style={{ fontSize: 12.5, color: "#fff", marginTop: 10, background: "rgba(168,59,50,0.35)", border: `1px solid ${BRAND.tomato}`, borderRadius: 8, padding: 10 }}>
              {placeError.reason === "stock" ? (
                <>
                  {lang === "ar"
                    ? "لم يعد بعض العناصر متوفرًا بنفس الكمية — يرجى تعديل سلتك:"
                    : "Some items are no longer available in that quantity — please adjust your cart:"}
                  <ul style={{ margin: "6px 0 0", paddingInlineStart: 18 }}>
                    {placeError.shortfalls.map((s) => (
                      <li key={s.name}>
                        {prodName(s.name, lang)} — {lang === "ar" ? `متبقٍ ${s.available} فقط` : `only ${s.available} left`}
                      </li>
                    ))}
                  </ul>
                </>
              ) : placeError.reason === "stale-slot" ? (
                lang === "ar"
                  ? "الفترة الزمنية التي اخترتها انتهت أثناء وجودك على هذه الصفحة — يرجى اختيار فترة أخرى."
                  : "The time slot you picked has since passed while you were on this page — please choose another one."
              ) : (
                lang === "ar"
                  ? "تعذّر إرسال طلبك — يبدو أن هناك مشكلة في الاتصال. لم يتم إرسال الطلب بعد، سلتك ما زالت كما هي. الرجاء إعادة المحاولة، أو تواصل معنا مباشرة عبر واتساب."
                  : "We couldn't send your order — looks like a connection issue. Nothing was charged and your cart is still here. Please try again, or reach us directly on WhatsApp."
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FormCard({ title, icon: Icon, children }) {
  return (
    <div style={{ background: "#fff", border: "1px solid rgba(198,162,76,0.22)", boxShadow: "0 2px 10px rgba(35,31,22,0.05)", borderRadius: 10, padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <Icon size={16} color={BRAND.green} />
        <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 17 }}>{title}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{children}</div>
    </div>
  );
}
function Field({ label, children }) {
  return (
    <div style={{ flex: 1 }}>
      <label style={{ fontSize: 12, fontWeight: 700, opacity: 0.7, display: "block", marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}
const inputStyle = {
  width: "100%",
  border: `1.5px solid ${BRAND.creamDeep}`,
  borderRadius: 8,
  padding: "10px 12px",
  fontFamily: "Manrope, sans-serif",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  background: BRAND.cream,
};
const backLinkStyle = { background: "none", border: "none", color: BRAND.green, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, marginBottom: 6, padding: 0 };

/* ------------------------------------ Confirmation ------------------------------------ */

function ConfirmationView({ order, orderId, setView }) {
  const { t } = useLang();
  return (
    <div style={{ paddingTop: 60, textAlign: "center" }}>
      <div style={{ width: 68, height: 68, borderRadius: "50%", background: BRAND.greenSoft, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
        <CheckCircle2 size={34} color={BRAND.green} />
      </div>
      <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 26 }}>{t("confirm_title")}</h2>
      <p style={{ opacity: 0.7 }}>
        {t("order_label")} <b style={{ fontFamily: "IBM Plex Mono, monospace" }}>{orderId}</b> {t("confirm_sub")}
      </p>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: BRAND.greenSoft, color: BRAND.green, fontSize: 12.5, fontWeight: 700, borderRadius: 999, padding: "8px 16px", marginTop: 6 }}>
        <UserIcon size={14} /> {t("shopper_note")}
      </div>
      {order?.pointsEarned > 0 && (
        <div style={{ display: "block", marginTop: 10 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#FBF0D9", color: BRAND.orangeDeep, fontSize: 12.5, fontWeight: 700, borderRadius: 999, padding: "8px 16px" }}>
            ⭐ You earned {order.pointsEarned} loyalty points on this order
          </span>
        </div>
      )}
      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 20, flexWrap: "wrap" }}>
        <PrimaryButton onClick={() => setView("track")}>{t("track_my_order")} <Truck size={16} /></PrimaryButton>
        <GhostButton onClick={() => setView("boxes")}>{t("continue_shopping")}</GhostButton>
      </div>
    </div>
  );
}
function formatPhoneDisplay(n) {
  // 971524786729 -> +971 52 478 6729
  return `+${n.slice(0, 3)} ${n.slice(3, 5)} ${n.slice(5, 8)} ${n.slice(8)}`;
}

/* ------------------------------------ Tracking ------------------------------------ */

function ReviewForm({ order }) {
  const { lang } = useLang();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadPct, setUploadPct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(() => {
    try { return localStorage.getItem(`dsf-reviewed-${order.id}`) === "1"; } catch { return false; }
  });
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    setError("");
    const reviewId = "R" + Date.now().toString(36).toUpperCase();
    let photoUrl = null;
    try {
      if (photoFile) photoUrl = await uploadReviewPhoto(photoFile, reviewId, setUploadPct);
    } catch {
      setError(lang === "ar" ? "فشل رفع الصورة — سنرسل التقييم بدون صورة." : "Photo upload failed — submitting without the photo instead.");
    }
    const review = {
      id: reviewId,
      orderId: order.id,
      customerName: order.customer.name,
      rating,
      text: text.trim(),
      photoUrl,
      createdAt: new Date().toISOString(),
      approved: false, // shows publicly only after Backstage approves it
    };
    const ok = await submitReview(review);
    if (ok) {
      if (order.customer.uid) awardReviewPoints(order.customer.uid, REVIEW_BONUS_POINTS); // fire-and-forget
      try { localStorage.setItem(`dsf-reviewed-${order.id}`, "1"); } catch {}
      setSubmitted(true);
    } else {
      setError(lang === "ar" ? "فشل إرسال التقييم — حاول مرة أخرى." : "Failed to submit — please try again.");
    }
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <div style={{ background: BRAND.greenSoft, borderRadius: 12, padding: 16, marginTop: 16, textAlign: "center" }}>
        <div style={{ fontWeight: 700, color: BRAND.green }}>
          {lang === "ar" ? `شكرًا لتقييمك! 🎉 (+${REVIEW_BONUS_POINTS} نقطة ولاء)` : `Thanks for your review! 🎉 (+${REVIEW_BONUS_POINTS} loyalty points)`}
        </div>
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
          {lang === "ar" ? "سيظهر تقييمك على الموقع بعد المراجعة." : "Your review will appear on the site once it's reviewed."}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", border: "1px solid rgba(198,162,76,0.22)", boxShadow: "0 2px 10px rgba(35,31,22,0.05)", borderRadius: 12, padding: 16, marginTop: 16 }}>
      <div style={{ fontWeight: 700, marginBottom: 10 }}>
        📸 {lang === "ar" ? `شارك تجربتك — احصل على ${REVIEW_BONUS_POINTS} نقاط إضافية!` : `Share your experience — earn ${REVIEW_BONUS_POINTS} bonus points!`}
      </div>
      <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => setRating(n)}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 26, padding: 0, lineHeight: 1, color: n <= rating ? BRAND.gold : BRAND.creamDeep }}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={lang === "ar" ? "كيف كانت تجربتك؟" : "How was your experience?"}
        rows={3}
        style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", width: "100%" }}
      />
      <div style={{ marginTop: 10 }}>
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFile} style={{ display: "none" }} />
        {photoPreview ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={photoPreview} alt="" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8 }} />
            <GhostButton onClick={() => { setPhotoFile(null); setPhotoPreview(null); }} style={{ fontSize: 12 }}>
              {lang === "ar" ? "إزالة الصورة" : "Remove photo"}
            </GhostButton>
          </div>
        ) : (
          <GhostButton onClick={() => fileInputRef.current?.click()} style={{ fontSize: 12.5 }}>
            📷 {lang === "ar" ? "أضف صورة (اختياري)" : "Add a photo (optional)"}
          </GhostButton>
        )}
      </div>
      {uploadPct !== null && uploadPct < 100 && <div style={{ fontSize: 11, opacity: 0.6, marginTop: 6 }}>{lang === "ar" ? "جارٍ الرفع…" : "Uploading…"} {uploadPct}%</div>}
      {error && <div style={{ fontSize: 12, color: BRAND.tomato, marginTop: 8 }}>{error}</div>}
      <PrimaryButton onClick={handleSubmit} style={{ marginTop: 12, opacity: submitting ? 0.6 : 1 }} full>
        {submitting ? (lang === "ar" ? "جارٍ الإرسال…" : "Submitting…") : (lang === "ar" ? "إرسال التقييم" : "Submit Review")}
      </PrimaryButton>
    </div>
  );
}

function TrackView({ orders, initialId }) {
  const { t, lang } = useLang();
  const [id, setId] = useState(initialId || "");
  const staticOrder = orders.find((o) => o.id.toLowerCase() === id.trim().toLowerCase());
  const [liveOrder, setLiveOrder] = useState(null);
  const order = liveOrder || staticOrder;
  const stepIndex = order ? STATUS_STEPS.findIndex((s) => s.key === order.status) : -1;
  const statusKeyMap = { placed: "status_placed", preparing: "status_preparing", out_for_delivery: "status_out", delivered: "status_delivered" };
  const [justDelivered, setJustDelivered] = useState(false);
  const prevStatusRef = useRef(null);

  // subscribe live once we have a real order id, so status + driver location
  // update automatically without the customer needing to refresh the page
  useEffect(() => {
    setLiveOrder(null);
    prevStatusRef.current = null;
    if (!staticOrder) return;
    const unsub = subscribeToOrder(staticOrder.id, setLiveOrder);
    return unsub;
  }, [staticOrder?.id]);

  // celebrate the moment delivery status flips to "delivered" while this
  // page happens to be open — a nice touch for anyone actively watching
  useEffect(() => {
    if (!order) return;
    if (prevStatusRef.current && prevStatusRef.current !== "delivered" && order.status === "delivered") {
      setJustDelivered(true);
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        [660, 880].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.4);
          osc.start(ctx.currentTime + i * 0.15);
          osc.stop(ctx.currentTime + i * 0.15 + 0.4);
        });
      } catch {}
    }
    prevStatusRef.current = order.status;
  }, [order?.status]);

  return (
    <div style={{ paddingTop: 22 }}>
      <SectionTitle eyebrow={t("track_eyebrow")} title={t("track_title")} />
      <div style={{ display: "flex", gap: 10, marginTop: 16, maxWidth: 420 }}>
        <input value={id} onChange={(e) => setId(e.target.value)} placeholder={t("track_placeholder")} style={inputStyle} />
      </div>

      {!id.trim() && <p style={{ opacity: 0.6, marginTop: 14, fontSize: 14 }}>{t("track_enter_id")}</p>}
      {id.trim() && !order && <p style={{ opacity: 0.6, marginTop: 14, fontSize: 14 }}>{t("track_not_found")}</p>}

      {justDelivered && (
        <div style={{ background: BRAND.green, color: "#fff", borderRadius: 12, padding: "14px 18px", marginTop: 16, maxWidth: 640, fontWeight: 700, textAlign: "center" }}>
          🎉 {lang === "ar" ? "تم توصيل طلبك للتو! بالهناء والشفاء." : "Your order has just arrived! Enjoy."}
        </div>
      )}

      {order && (
        <div style={{ marginTop: 26, background: "#fff", border: "1px solid rgba(198,162,76,0.22)", boxShadow: "0 2px 10px rgba(35,31,22,0.05)", borderRadius: 16, padding: 24, maxWidth: 640 }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>{t("order_label")}</div>
              <div style={{ fontFamily: "IBM Plex Mono, monospace", fontWeight: 700 }}>{order.id}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>{t("delivery_window")}</div>
              <div style={{ fontWeight: 700 }}>{order.customer.date} · {localSlot(order.customer.slot, lang)}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>{t("total")}</div>
              <div style={{ fontWeight: 700 }}>{money(order.total)}</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center" }}>
            {STATUS_STEPS.map((s, i) => (
              <React.Fragment key={s.key}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                  <div style={{ position: "relative", width: 40, height: 40 }}>
                    {i === stepIndex && (
                      <div className="dsf-pulse-ring" style={{ position: "absolute", inset: 0, borderRadius: "50%", background: BRAND.green }} />
                    )}
                    <div
                      style={{
                        position: "relative", width: 40, height: 40, borderRadius: "50%",
                        background: i <= stepIndex ? BRAND.green : BRAND.creamDeep,
                        color: i <= stepIndex ? "#fff" : BRAND.ink,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <s.icon size={18} />
                    </div>
                  </div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, marginTop: 6, textAlign: "center", opacity: i <= stepIndex ? 1 : 0.5 }}>{t(statusKeyMap[s.key])}</div>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div style={{ height: 3, flex: 1, background: i < stepIndex ? BRAND.green : BRAND.creamDeep, marginBottom: 22 }} />
                )}
              </React.Fragment>
            ))}
          </div>

          {order.status === "out_for_delivery" && order.driverLat && order.driverLng && (
            <div style={{ marginTop: 22 }}>
              <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.7, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {lang === "ar" ? "التتبع المباشر" : "Live Tracking"}
              </div>
              <LiveTrackingMap driverLat={order.driverLat} driverLng={order.driverLng} destLat={order.customer.lat} destLng={order.customer.lng} lang={lang} />
              <div style={{ fontSize: 11, opacity: 0.55, marginTop: 6 }}>
                {lang === "ar" ? "يتحدّث موقع السائق تلقائيًا" : "Driver location updates automatically"}
              </div>
            </div>
          )}

          <div style={{ marginTop: 22, borderTop: `1px dashed ${BRAND.creamDeep}`, paddingTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.7, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>{t("items_label")}</div>
            {order.items.map((it) => (
              <div key={it.id}>
                <Row label={`${it.name} × ${it.qty}`} value={money(it.qty * it.price)} />
                {it.breakdown && it.breakdown.length > 0 && (
                  <div style={{ fontSize: 11.5, opacity: 0.6, marginTop: -6, marginBottom: 6 }}>
                    {breakdownText(it, lang)}
                    <span style={{ fontWeight: 700 }}>
                      {" "}— {breakdownTotalPieces(it) * it.qty} {lang === "ar" ? "قطعة بالإجمالي" : "pieces total"}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
          {order.status === "delivered" && <ReviewForm order={order} />}
        </div>
      )}
    </div>
  );
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function LiveTrackingMap({ driverLat, driverLng, destLat, destLng, lang }) {
  const leafletReady = useLeaflet();
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const driverMarker = useRef(null);
  const destMarker = useRef(null);
  const routeLine = useRef(null);
  const [eta, setEta] = useState(null); // { km, min, estimated }
  const lastFetchRef = useRef(0);

  useEffect(() => {
    if (!leafletReady || !mapRef.current || mapInstance.current) return;
    const L = window.L;
    const map = L.map(mapRef.current, { zoomControl: false }).setView([driverLat, driverLng], 14);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);
    const driverIcon = L.divIcon({
      html: `
        <div style="position:relative;width:34px;height:34px;">
          <div class="dsf-pulse-ring" style="position:absolute;inset:0;border-radius:50%;background:${BRAND.green};opacity:0.35;"></div>
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:${BRAND.green};width:34px;height:34px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:16px;">🛵</div>
        </div>`,
      className: "", iconSize: [34, 34], iconAnchor: [17, 17],
    });
    driverMarker.current = L.marker([driverLat, driverLng], { icon: driverIcon }).addTo(map);
    if (destLat && destLng) {
      const destIcon = L.divIcon({
        html: `<div style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;background:${BRAND.orangeDeep};border-radius:50% 50% 50% 0;transform:rotate(45deg);border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);"><span style="transform:rotate(-45deg);font-size:14px;">🏠</span></div>`,
        className: "", iconSize: [30, 30], iconAnchor: [15, 28],
      });
      destMarker.current = L.marker([destLat, destLng], { icon: destIcon }).addTo(map);
      map.fitBounds([[driverLat, driverLng], [destLat, destLng]], { padding: [30, 30] });
    }
    mapInstance.current = map;
    setTimeout(() => map.invalidateSize(), 200);
  }, [leafletReady]);

  useEffect(() => {
    if (!driverMarker.current) return;
    driverMarker.current.setLatLng([driverLat, driverLng]);
    if (!destMarker.current) mapInstance.current.setView([driverLat, driverLng]);
  }, [driverLat, driverLng]);

  // Real driving distance/ETA via OSRM (free, no API key) — throttled to
  // once every 15s since driver position updates far more often than that,
  // and the free public OSRM server shouldn't be hammered on every ping.
  useEffect(() => {
    if (!destLat || !destLng) return;
    const now = Date.now();
    if (now - lastFetchRef.current < 15000) return;
    lastFetchRef.current = now;

    let cancelled = false;
    async function fetchRoute() {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${driverLng},${driverLat};${destLng},${destLat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        const route = data.routes && data.routes[0];
        if (!route) throw new Error("no route");
        if (cancelled) return;
        setEta({ km: route.distance / 1000, min: route.duration / 60, estimated: false });

        // draw the actual road route on the map, replacing any previous line
        if (mapInstance.current && window.L && route.geometry) {
          if (routeLine.current) mapInstance.current.removeLayer(routeLine.current);
          const latlngs = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
          routeLine.current = window.L.polyline(latlngs, { color: BRAND.green, weight: 4, opacity: 0.7 }).addTo(mapInstance.current);
        }
      } catch {
        if (cancelled) return;
        // free routing service unreachable — fall back to a straight-line
        // estimate so the customer still sees something useful
        const km = haversineKm(driverLat, driverLng, destLat, destLng);
        setEta({ km, min: (km / 25) * 60, estimated: true }); // ~25km/h assumed city driving speed
      }
    }
    fetchRoute();
    return () => {
      cancelled = true;
    };
  }, [driverLat, driverLng, destLat, destLng]);

  return (
    <div>
      {eta && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 13.5, fontWeight: 700, color: BRAND.green }}>
          <Truck size={15} />
          {eta.km < 1
            ? lang === "ar" ? `${Math.round(eta.km * 1000)} م` : `${Math.round(eta.km * 1000)} m away`
            : lang === "ar" ? `${eta.km.toFixed(1)} كم` : `${eta.km.toFixed(1)} km away`}
          {" · "}
          {lang === "ar" ? `حوالي ${Math.max(1, Math.round(eta.min))} دقيقة` : `~${Math.max(1, Math.round(eta.min))} min`}
          {eta.estimated && (
            <span style={{ fontWeight: 400, opacity: 0.6, fontSize: 11.5 }}>
              {lang === "ar" ? "(تقديري)" : "(estimated)"}
            </span>
          )}
        </div>
      )}
      <div ref={mapRef} style={{ width: "100%", height: 240, borderRadius: 12, border: "1px solid rgba(198,162,76,0.22)", boxShadow: "0 2px 10px rgba(35,31,22,0.05)" }} />
    </div>
  );
}

function DriverModeView({ orderId, lang }) {
  const [order, setOrder] = useState(null);
  const [sharing, setSharing] = useState(false);
  const [lastSent, setLastSent] = useState(null);
  const [error, setError] = useState(null);
  const watchId = useRef(null);

  useEffect(() => {
    if (!orderId) return;
    const unsub = subscribeToOrder(orderId, setOrder);
    return unsub;
  }, [orderId]);

  useEffect(() => {
    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    };
  }, []);

  function geoErrorMessage(err) {
    if (err.code === 1) return lang === "ar" ? "تم رفض إذن الموقع. فعّل صلاحية الموقع لهذا الموقع من إعدادات المتصفح." : "Location permission denied. Enable location access for this site in your browser settings.";
    if (err.code === 2) return lang === "ar" ? "تعذر تحديد الموقع حاليًا." : "Position unavailable right now.";
    if (err.code === 3) return lang === "ar" ? "انتهت مهلة تحديد الموقع." : "Location request timed out.";
    return lang === "ar" ? "تعذرت مشاركة الموقع." : "Couldn't share location.";
  }

  function startSharing() {
    setError(null);
    if (!navigator.geolocation) {
      setError(lang === "ar" ? "المتصفح لا يدعم تحديد الموقع." : "This browser doesn't support location sharing.");
      return;
    }
    setSharing(true);
    // Safety net: some browsers/devices grant permission but never actually
    // deliver a position (common on laptops without real GPS, or when the
    // OS-level location service is off even though the site permission was
    // granted). The browser's own watchPosition timeout doesn't always fire
    // reliably in that case, so we track it ourselves too.
    const stuckTimer = setTimeout(() => {
      setLastSent((prev) => {
        if (!prev) {
          setError(
            lang === "ar"
              ? "لم يصل أي موقع بعد. على اللابتوب، تأكد من تفعيل خدمات الموقع لهذا المتصفح من إعدادات النظام. للحصول على أفضل نتيجة، افتح هذه الصفحة على هاتف جوال."
              : "No position has come through yet. On a laptop, make sure Location Services are enabled for this browser in your system settings. For best results, open this page on a mobile phone instead."
          );
        }
        return prev;
      });
    }, 20000);

    watchId.current = navigator.geolocation.watchPosition(
      async (pos) => {
        clearTimeout(stuckTimer);
        const ok = await updateDriverLocation(orderId, pos.coords.latitude, pos.coords.longitude);
        if (ok) {
          setLastSent(new Date());
          setError(null);
        } else {
          setError(lang === "ar" ? "فشل حفظ الموقع — تحقق من اتصالك بالإنترنت." : "Failed to save location — check your internet connection.");
        }
      },
      (err) => {
        // A single TIMEOUT or POSITION_UNAVAILABLE is normal and often just
        // a momentary weak-signal blip — watchPosition keeps trying on its
        // own in the background regardless, so stopping the whole session
        // over one hiccup meant a driver could get stuck needing to tap
        // "start sharing" again and again. Only a real permission denial
        // (code 1) is something the driver actually needs to act on.
        if (err.code === 1) {
          clearTimeout(stuckTimer);
          setSharing(false);
          setError(geoErrorMessage(err));
        } else {
          setError(geoErrorMessage(err)); // shown as a transient notice; sharing keeps running
        }
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  }

  function stopSharing() {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    setSharing(false);
  }

  if (!orderId) {
    return <div style={{ paddingTop: 60, textAlign: "center", opacity: 0.6 }}>{lang === "ar" ? "رابط غير صالح" : "Invalid link"}</div>;
  }

  return (
    <div style={{ paddingTop: 40, maxWidth: 420, margin: "0 auto", textAlign: "center" }}>
      <Truck size={32} color={BRAND.green} />
      <h2 style={{ fontFamily: "Playfair Display, serif", marginTop: 10 }}>{lang === "ar" ? "وضع التوصيل" : "Delivery Mode"}</h2>
      {order ? (
        <>
          <div style={{ fontFamily: "IBM Plex Mono, monospace", fontWeight: 700, marginTop: 6 }}>{order.id}</div>
          <div style={{ fontSize: 13.5, opacity: 0.7, marginTop: 4 }}>{order.customer?.name} — {order.customer?.address}, {order.customer?.area}</div>
        </>
      ) : (
        <div style={{ opacity: 0.6, marginTop: 8 }}>{lang === "ar" ? "جارٍ تحميل الطلب…" : "Loading order…"}</div>
      )}

      {error && (
        <div style={{ background: "#FDEAEA", color: BRAND.tomato, border: `1px solid ${BRAND.tomato}`, borderRadius: 10, padding: "10px 14px", fontSize: 12.5, marginTop: 16, textAlign: "left" }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: 28 }}>
        {!sharing ? (
          <PrimaryButton onClick={startSharing}>
            <MapPin size={16} /> {lang === "ar" ? "ابدأ مشاركة موقعي" : "Start Sharing My Location"}
          </PrimaryButton>
        ) : (
          <>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: BRAND.greenSoft, color: BRAND.green, fontWeight: 700, borderRadius: 999, padding: "10px 18px" }}>
              🟢 {lang === "ar" ? "جارٍ مشاركة موقعك" : "Sharing your location"}
            </div>
            {lastSent && (
              <div style={{ fontSize: 11.5, opacity: 0.55, marginTop: 8 }}>
                {lang === "ar" ? "آخر تحديث" : "Last update"}: {lastSent.toLocaleTimeString()}
              </div>
            )}
            <div style={{ marginTop: 14 }}>
              <GhostButton onClick={stopSharing}>{lang === "ar" ? "إيقاف المشاركة" : "Stop Sharing"}</GhostButton>
            </div>
          </>
        )}
      </div>
      <p style={{ fontSize: 12, opacity: 0.55, marginTop: 22 }}>
        {lang === "ar"
          ? "اترك هذه الصفحة مفتوحة أثناء التوصيل حتى يتمكن العميل من رؤية موقعك على الخريطة مباشرة."
          : "Keep this page open during the delivery so the customer can see your live position on their tracking page."}
      </p>
    </div>
  );
}

/* ------------------------------------ Invoice (printable) ------------------------------------ */

// A simple, printable B2B quotation for Office Friday Box leads — opened as
// an overlay from the Leads tab, using the exact same "browser print → save
// as PDF" approach as the customer invoice, so no PDF library is needed.
// The price starts from the suggested tier but is editable, since the admin
// may have already agreed something different on a call before generating
// this document.
function QuotationView({ lead, onClose }) {
  const [orderType, setOrderType] = useState("recurring"); // "recurring" | "one-time"
  const [weeklyPrice, setWeeklyPrice] = useState(() => {
    const suggested = suggestedOfficeBoxWeeklyPrice(lead.headcount);
    const match = suggested && suggested.match(/[\d,]+/);
    return match ? Number(match[0].replace(",", "")) : 0;
  });
  const quoteNumber = "Q" + lead.id.slice(-6).toUpperCase();
  const quoteDate = new Date();
  const validUntil = new Date(quoteDate.getTime() + 14 * 24 * 60 * 60 * 1000);
  const deliveryDay = (lead.message || "").replace("Preferred delivery day: ", "") || "Friday";
  const monthlyEstimate = weeklyPrice * 4.33;
  const isRecurring = orderType === "recurring";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(18,56,34,0.5)", zIndex: 200, overflowY: "auto", padding: "24px 16px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ color: "#fff", fontSize: 13 }}>Print-ready — use your browser's Print → "Save as PDF" to download.</div>
          <div style={{ display: "flex", gap: 8 }}>
            <GhostButton onClick={onClose} style={{ background: "#fff" }}>Close</GhostButton>
            <PrimaryButton onClick={() => window.print()}>🖨 Print / Save as PDF</PrimaryButton>
          </div>
        </div>
        <div className="no-print" style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {[{ key: "recurring", label: "Recurring weekly" }, { key: "one-time", label: "One-time order" }].map((o) => (
            <button
              key={o.key}
              onClick={() => setOrderType(o.key)}
              style={{
                flex: 1, padding: "10px 0", borderRadius: 10, fontSize: 13.5, fontWeight: 700, cursor: "pointer",
                border: `1.5px solid ${orderType === o.key ? BRAND.gold : "rgba(255,255,255,0.4)"}`,
                background: orderType === o.key ? BRAND.gold : "rgba(255,255,255,0.1)", color: orderType === o.key ? BRAND.ink : "#fff",
              }}
            >
              {o.label}
            </button>
          ))}
        </div>

        <div style={{ background: "#fff", border: `1px solid ${BRAND.creamDeep}`, borderRadius: 12, padding: 36 }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: `2px solid ${BRAND.green}`, paddingBottom: 20, marginBottom: 24 }}>
            <Logo size={150} />
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 800, fontSize: 24, color: BRAND.green }}>QUOTATION</div>
              <div style={{ fontSize: 13, opacity: 0.7, marginTop: 6, fontFamily: "IBM Plex Mono, monospace" }}>Quote #: {quoteNumber}</div>
              <div style={{ fontSize: 13, opacity: 0.7 }}>Date: {quoteDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div>
              <div style={{ fontSize: 13, opacity: 0.7 }}>Valid until: {validUntil.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div>
            </div>
          </div>

          {/* From / To */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 26 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: BRAND.orangeDeep, textTransform: "uppercase", marginBottom: 6 }}>From</div>
              <div style={{ fontWeight: 700, fontSize: 14.5 }}>Darousha Fresh</div>
              <div style={{ fontSize: 13, opacity: 0.7, lineHeight: 1.6 }}>
                {BUSINESS_ADDRESS}<br />
                {formatPhoneDisplay(WHATSAPP_NUMBER)}<br />
                {BUSINESS_EMAIL}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: BRAND.orangeDeep, textTransform: "uppercase", marginBottom: 6 }}>Quotation For</div>
              <div style={{ fontWeight: 700, fontSize: 14.5 }}>{lead.company}</div>
              <div style={{ fontSize: 13, opacity: 0.7, lineHeight: 1.6 }}>
                Attn: {lead.contact}<br />
                {lead.phone}
              </div>
            </div>
          </div>

          {/* Line item */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${BRAND.green}`, textAlign: "left" }}>
                <th style={{ padding: "8px 4px", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em" }}>Description</th>
                <th style={{ padding: "8px 4px", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "right" }}>
                  {isRecurring ? "Weekly Rate (AED)" : "Price (AED)"}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: `1px solid ${BRAND.creamDeep}` }}>
                <td style={{ padding: "12px 4px" }}>
                  <div style={{ fontWeight: 700 }}>
                    Office Box — {isRecurring ? "recurring weekly delivery" : "one-time delivery"}
                  </div>
                  <div style={{ fontSize: 12.5, opacity: 0.65, marginTop: 2 }}>
                    Sized for ~{lead.headcount || "—"} employees
                    {isRecurring ? ` · Delivered every ${deliveryDay}` : " · Single delivery on a date to be agreed"}
                    · Hand-picked, same-day fresh produce
                  </div>
                </td>
                <td style={{ padding: "12px 4px", textAlign: "right", verticalAlign: "top" }}>
                  <div className="no-print">
                    <input
                      type="number"
                      value={weeklyPrice}
                      onChange={(e) => setWeeklyPrice(Number(e.target.value) || 0)}
                      style={{ ...inputStyle, width: 90, textAlign: "right", padding: "6px 8px" }}
                    />
                  </div>
                  <div className="print-only-inline" style={{ fontWeight: 700 }}>{money(weeklyPrice)}</div>
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 28 }}>
            <div style={{ minWidth: 220 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, padding: "4px 0" }}>
                <span style={{ opacity: 0.7 }}>{isRecurring ? "Per week" : "Total (this order)"}</span>
                <span style={{ fontWeight: 700 }}>{money(weeklyPrice)}</span>
              </div>
              {isRecurring && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, padding: "4px 0", borderTop: `1px solid ${BRAND.creamDeep}` }}>
                  <span style={{ opacity: 0.7 }}>Estimated per month</span>
                  <span style={{ fontWeight: 700 }}>{money(monthlyEstimate)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Terms */}
          <div style={{ fontSize: 12, opacity: 0.65, lineHeight: 1.7, borderTop: `1px solid ${BRAND.creamDeep}`, paddingTop: 16 }}>
            <b>Terms:</b> This quotation is valid for 14 days from the date above. {isRecurring
              ? "Delivery is recurring weekly on the agreed day; the order can be paused or cancelled with prior notice."
              : "This is a single, one-time delivery on a date to be agreed after acceptance."} Payment terms (cash on delivery or monthly invoicing) to be confirmed upon acceptance. Prices are in AED and exclude VAT unless stated otherwise.
          </div>
        </div>
      </div>
    </div>
  );
}


function InvoiceView({ orderId, orders }) {
  const [order, setOrder] = useState(() => orders.find((o) => o.id === orderId) || null);

  useEffect(() => {
    if (!orderId) return;
    const unsub = subscribeToOrder(orderId, setOrder);
    return unsub;
  }, [orderId]);

  if (!orderId) {
    return <div style={{ paddingTop: 60, textAlign: "center", opacity: 0.6 }}>Invalid invoice link.</div>;
  }
  if (!order) {
    return <div style={{ paddingTop: 60, textAlign: "center", opacity: 0.6 }}>Loading invoice…</div>;
  }

  const c = order.customer;
  const invoiceDate = new Date(order.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div style={{ paddingTop: 22, maxWidth: 760, margin: "0 auto" }}>
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ fontSize: 13, opacity: 0.6 }}>This invoice is print-ready — the header, footer and this bar won't appear on paper.</div>
        <PrimaryButton onClick={() => window.print()}>🖨 Print Invoice</PrimaryButton>
      </div>

      <div style={{ background: "#fff", border: "1px solid rgba(198,162,76,0.22)", boxShadow: "0 2px 10px rgba(35,31,22,0.05)", borderRadius: 12, padding: 36 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: `2px solid ${BRAND.green}`, paddingBottom: 20, marginBottom: 24 }}>
          <div>
            <Logo size={150} />
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 800, fontSize: 24, color: BRAND.green }}>TAX INVOICE</div>
            <div style={{ fontSize: 13, opacity: 0.7, marginTop: 6, fontFamily: "IBM Plex Mono, monospace" }}>Invoice #: {order.id}</div>
            <div style={{ fontSize: 13, opacity: 0.7 }}>Date: {invoiceDate}</div>
          </div>
        </div>

        {/* From / Bill To */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 26 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: BRAND.orangeDeep, textTransform: "uppercase", marginBottom: 6 }}>From</div>
            <div style={{ fontWeight: 700, fontSize: 14.5 }}>Darousha Fresh</div>
            <div style={{ fontSize: 13, opacity: 0.7, lineHeight: 1.6 }}>
              {BUSINESS_ADDRESS}<br />
              {formatPhoneDisplay(WHATSAPP_NUMBER)}<br />
              {BUSINESS_EMAIL}<br />
              TRN: {BUSINESS_TRN.startsWith("YOUR_") ? "—" : BUSINESS_TRN}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: BRAND.orangeDeep, textTransform: "uppercase", marginBottom: 6 }}>Bill To</div>
            <div style={{ fontWeight: 700, fontSize: 14.5 }}>{c.name}</div>
            <div style={{ fontSize: 13, opacity: 0.7, lineHeight: 1.6 }}>
              {c.address}, {c.area}<br />
              {c.phone}<br />
              Delivery: {c.date} · {c.slot}<br />
              Payment: {c.payment === "cod" ? "Cash on delivery" : "Card"}
            </div>
          </div>
        </div>

        {/* Items table */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
          <thead>
            <tr style={{ background: BRAND.greenSoft }}>
              <th style={{ textAlign: "left", padding: "9px 10px", fontSize: 12, fontWeight: 700 }}>Item</th>
              <th style={{ textAlign: "center", padding: "9px 10px", fontSize: 12, fontWeight: 700 }}>Qty</th>
              <th style={{ textAlign: "right", padding: "9px 10px", fontSize: 12, fontWeight: 700 }}>Unit Price</th>
              <th style={{ textAlign: "right", padding: "9px 10px", fontSize: 12, fontWeight: 700 }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((it) => (
              <tr key={it.id} style={{ borderBottom: `1px solid ${BRAND.creamDeep}` }}>
                <td style={{ padding: "9px 10px", fontSize: 13 }}>
                  {it.name}
                  {it.breakdown && it.breakdown.length > 0 && (
                    <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>
                      {breakdownText(it, "en")}
                      <span style={{ fontWeight: 700 }}> — {breakdownTotalPieces(it) * it.qty} pieces total</span>
                    </div>
                  )}
                </td>
                <td style={{ padding: "9px 10px", fontSize: 13, textAlign: "center" }}>{it.qty}</td>
                <td style={{ padding: "9px 10px", fontSize: 13, textAlign: "right" }}>{money(it.price)}</td>
                <td style={{ padding: "9px 10px", fontSize: 13, textAlign: "right", fontWeight: 700 }}>{money(it.qty * it.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: 260 }}>
            <Row label="Subtotal" value={money(order.subtotal)} />
            <Row label="Delivery fee" value={order.deliveryFee === 0 ? "Free" : money(order.deliveryFee)} />
            <Row label="VAT (5%)" value={money(order.vat || 0)} />
            <hr style={{ border: "none", borderTop: `1px dashed ${BRAND.creamDeep}`, margin: "8px 0" }} />
            <Row label="Total" value={money(order.total)} bold />
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 34, paddingTop: 18, borderTop: `1px solid ${BRAND.creamDeep}`, textAlign: "center" }}>
          <div style={{ fontFamily: "Playfair Display, serif", fontStyle: "italic", fontSize: 14, color: BRAND.green }}>Thank you for choosing Darousha Fresh 🌿</div>
          <div style={{ fontSize: 11, opacity: 0.5, marginTop: 6 }}>Questions about this order? WhatsApp us at {formatPhoneDisplay(WHATSAPP_NUMBER)}</div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------ Privacy (branded) ------------------------------------ */

function TermsView({ setView }) {
  const { lang } = useLang();
  const isAr = lang === "ar";
  return (
    <div style={{ paddingTop: 40, maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
        <Logo size={200} />
      </div>
      <h2 style={{ fontFamily: "Playfair Display, serif", marginTop: 8, textAlign: "center" }}>{isAr ? "الشروط والأحكام" : "Terms & Conditions"}</h2>
      <p style={{ textAlign: "center", fontSize: 12, opacity: 0.6, marginBottom: 12 }}>{isAr ? "آخر تحديث: يوليو ٢٠٢٦" : "Last updated: July 2026"}</p>
      <div style={{ textAlign: isAr ? "right" : "left", background: "#fff", border: "1px solid rgba(198,162,76,0.22)", boxShadow: "0 2px 10px rgba(35,31,22,0.05)", borderRadius: 14, padding: 24, fontSize: 13.5, lineHeight: 1.75, opacity: 0.9 }}>
        {isAr ? (
          <>
            <p><b>الطلبات.</b> يُعد تقديم طلب عبر هذا الموقع طلبًا لشراء العناصر الموجودة في سلتك بالسعر المُدرج. سنؤكد طلبك فور استلامه؛ لا يُضمن توفر كل عنصر حتى يتم التأكيد.</p>
            <p><b>الأسعار.</b> الأسعار مُدرجة بالدرهم الإماراتي وتشمل سعر العنصر فقط؛ تُضاف رسوم توصيل كما هو موضح عند الدفع (مجانية فوق الحد المُدرج في سلتك). قد تتغير الأسعار في أي وقت ولا تؤثر على الطلبات المؤكدة مسبقًا.</p>
            <p><b>الدفع.</b> نقبل حاليًا الدفع نقدًا عند التوصيل. أنت توافق على توفير الدفع بالطريقة التي اخترتها وقت التوصيل.</p>
            <p><b>التوصيل.</b> مواعيد التوصيل تقديرية وليست مضمونة. سنبذل قصارى جهدنا لإخبارك بأي تأخير. يجب توفر شخص في عنوان التوصيل خلال الفترة المختارة.</p>
            <p><b>الجودة والاستبدال.</b> نظرًا لتفاوت المنتجات الطازجة حسب الموسم والتوفر، قد يُستبدل عنصر بآخر مشابه أحيانًا، أو يُرد ثمنه/يُضاف كرصيد إذا لم يكن متوفرًا. يرجى التواصل معنا خلال ٢٤ ساعة من التوصيل بخصوص أي مشكلة في الجودة.</p>
            <p><b>الإلغاء.</b> يمكن إلغاء الطلبات أو تعديلها بالتواصل معنا قبل تجهيزها. بمجرد أن يصبح الطلب "في الطريق للتوصيل"، لا يمكن إلغاؤه.</p>
            <p><b>الحسابات.</b> إذا أنشأت حسابًا، فأنت مسؤول عن الحفاظ على أمان بيانات تسجيل الدخول الخاصة بك وعن دقة المعلومات التي تقدمها.</p>
          </>
        ) : (
          <>
            <p><b>Orders.</b> Placing an order through this site is a request to purchase the items in your cart at the listed price. We'll confirm your order once it's received; availability of individual items is not guaranteed until confirmed.</p>
            <p><b>Pricing.</b> Prices are shown in AED and include the cost of the item only; a delivery fee applies as shown at checkout (free above the threshold displayed in your cart). Prices may change at any time and don't affect orders already confirmed.</p>
            <p><b>Payment.</b> We currently accept cash on delivery. You agree to have payment ready in the method you selected at the time of delivery.</p>
            <p><b>Delivery.</b> Delivery windows are estimates, not guarantees. We'll do our best to notify you of any delay. Someone should be available at the delivery address during the selected window.</p>
            <p><b>Quality & substitutions.</b> As fresh produce varies by season and supply, an item may occasionally be substituted with a comparable one, or refunded/credited if unavailable. Please contact us within 24 hours of delivery about any quality issue.</p>
            <p><b>Cancellations.</b> Orders can be cancelled or changed by contacting us before they're marked as prepared. Once an order is out for delivery, it can no longer be cancelled.</p>
            <p><b>Accounts.</b> If you create an account, you're responsible for keeping your login details secure and for the accuracy of the information you provide.</p>
          </>
        )}
      </div>
      <div style={{ textAlign: "center" }}>
        <GhostButton onClick={() => setView("home")} style={{ marginTop: 20 }}><ArrowLeft size={15} /> {isAr ? "العودة للرئيسية" : "Back home"}</GhostButton>
      </div>
    </div>
  );
}

function DeliveryZoneMap() {
  const leafletReady = useLeaflet();
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  // Approximate central coordinates for each covered area — enough to give
  // customers a real sense of coverage without claiming precise boundaries.
  const AREA_COORDS = {
    Downtown: [25.1972, 55.2744],
    Marina: [25.0805, 55.1403],
    "Al Barsha": [25.1122, 55.2000],
    Jumeirah: [25.2285, 55.2593],
    Deira: [25.2697, 55.3095],
    Mirdif: [25.2167, 55.4167],
  };

  useEffect(() => {
    if (!leafletReady || !mapRef.current || mapInstance.current) return;
    const L = window.L;
    const map = L.map(mapRef.current).setView([25.19, 55.26], 10.5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);
    Object.entries(AREA_COORDS).forEach(([name, coords]) => {
      L.circle(coords, { radius: 3000, color: BRAND.green, fillColor: BRAND.green, fillOpacity: 0.15, weight: 1.5 }).addTo(map);
      L.marker(coords).addTo(map).bindPopup(`<b>${name}</b>`);
    });
    mapInstance.current = map;
    setTimeout(() => map.invalidateSize(), 200);
  }, [leafletReady]);

  return <div ref={mapRef} style={{ width: "100%", height: 320, borderRadius: 14, border: "1px solid rgba(198,162,76,0.22)", boxShadow: "0 2px 10px rgba(35,31,22,0.05)", marginTop: 20 }} />;
}

function LocationView({ setView }) {
  return (
    <div style={{ paddingTop: 40, maxWidth: 640, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
        <Logo size={90} />
      </div>
      <SectionTitle eyebrow="Where we deliver" title="Delivery areas" />
      <p style={{ fontSize: 14, opacity: 0.75, marginTop: 12, lineHeight: 1.6 }}>
        We currently deliver across the following areas. Pick yours at checkout — if you don't see your neighborhood listed, choose "Other" and we'll confirm whether we can reach you.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
        {AREAS.map((a) => (
          <span key={a} style={{ fontSize: 13, background: BRAND.greenSoft, color: BRAND.green, borderRadius: 999, padding: "6px 14px", fontWeight: 600 }}>
            {a}
          </span>
        ))}
      </div>

      <DeliveryZoneMap />
      <p style={{ fontSize: 11.5, opacity: 0.55, marginTop: 8 }}>
        Shaded circles show roughly where we deliver — not exact boundaries. Not sure if we reach your exact address? Ask us on WhatsApp below.
      </p>

      <div style={{ marginTop: 32, background: "#fff", border: "1px solid rgba(198,162,76,0.22)", boxShadow: "0 2px 10px rgba(35,31,22,0.05)", borderRadius: 14, padding: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <MapPin size={16} color={BRAND.green} />
          <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 17 }}>Get in touch</div>
        </div>
        <p style={{ fontSize: 13.5, opacity: 0.75, lineHeight: 1.7 }}>
          Darousha Fresh delivers across Dubai. For questions about whether we cover your area, or to arrange delivery outside our standard zones, reach us on WhatsApp:
        </p>
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 10, background: "#25D366", color: "#fff", fontWeight: 700, fontSize: 13.5, padding: "10px 16px", borderRadius: 10, textDecoration: "none" }}
        >
          <Phone size={15} /> {formatPhoneDisplay(WHATSAPP_NUMBER)}
        </a>
      </div>

      <div style={{ textAlign: "center", marginTop: 24 }}>
        <GhostButton onClick={() => setView("home")}><ArrowLeft size={15} /> Back home</GhostButton>
      </div>
    </div>
  );
}

const BLOG_POSTS = [
  {
    id: "why-we-started",
    image: "https://i.postimg.cc/dvy5CLyC/IMG-9261.png",
    title: "Why We Started Darousha Fresh", titleAr: "لماذا بدأنا داروشة فريش",
    date: "2026-06-01",
    excerpt: "A short note on what was missing from vegetable delivery in Dubai, and why we built it differently.",
    excerptAr: "كلمة قصيرة عمّا كان ناقصًا في توصيل الخضروات في دبي، ولماذا بنينا الأمر بشكل مختلف.",
    body: [
      "Most grocery delivery in Dubai treats vegetables the same way it treats everything else — a SKU in a warehouse, picked by whoever's on shift, packed as fast as possible. We didn't think that was good enough for something people are actually going to cook and eat.",
      "Darousha Fresh started with a simple idea: what if someone actually looked at what they were packing for you? Not a robotic pick-list, but a real person selecting the ripest tomatoes, the freshest herbs, the produce they'd want in their own kitchen.",
      "That's still the whole idea today. Every order is hand-picked, same-day, by our team — not pulled from a shelf that's been sitting since yesterday.",
    ],
    bodyAr: [
      "معظم خدمات توصيل البقالة في دبي تتعامل مع الخضروات بنفس الطريقة التي تتعامل بها مع أي شيء آخر — مجرد رمز منتج في مستودع، يلتقطه أي موظف متواجد، ويُعبأ بأسرع ما يمكن. لم نعتقد أن هذا كافٍ لشيء سيطبخه الناس ويأكلونه فعليًا.",
      "بدأت داروشة فريش بفكرة بسيطة: ماذا لو نظر شخص فعليًا إلى ما يعبئه لك؟ ليس قائمة انتقاء آلية، بل شخص حقيقي يختار أنضج الطماطم وأطزج الأعشاب، المنتجات التي يريدها في مطبخه الخاص.",
      "لا تزال هذه هي الفكرة الكاملة اليوم. كل طلب يُختار يدويًا، في نفس اليوم، من قِبل فريقنا — وليس من رف كان موجودًا منذ الأمس.",
    ],
  },
  {
    id: "personal-shopper-meaning",
    image: "https://i.postimg.cc/7P8M9n2S/IMG-9262.png",
    title: "What \"Personal Shopper\" Actually Means Here", titleAr: "ماذا يعني \"المتسوق الشخصي\" فعليًا هنا",
    date: "2026-06-15",
    excerpt: "It's not a marketing phrase — here's exactly what happens between you placing an order and it arriving.",
    excerptAr: "إنها ليست عبارة تسويقية — إليك بالضبط ما يحدث بين لحظة طلبك ووصوله.",
    body: [
      "When you place an order, it doesn't go to a warehouse robot or an anonymous picker working through a queue. It goes to a real person on our team, the same day, who physically selects each item.",
      "That means checking for ripeness, avoiding the bruised piece at the back, and packing produce the way you'd want it packed if you were doing it yourself.",
      "It's a small thing on paper, but it's the difference between a box of vegetables and a box someone actually thought about.",
    ],
    bodyAr: [
      "عندما تضع طلبًا، فإنه لا يذهب إلى روبوت في مستودع أو شخص مجهول يعمل ضمن طابور. يذهب إلى شخص حقيقي في فريقنا، في نفس اليوم، يختار كل منتج بنفسه.",
      "هذا يعني التحقق من النضج، وتجنب القطعة المتضررة في الخلف، وتعبئة المنتجات بالطريقة التي تريدها لو كنت تفعل ذلك بنفسك.",
      "قد يبدو الأمر بسيطًا على الورق، لكنه الفرق بين صندوق خضروات وصندوق فكّر فيه أحدهم فعلًا.",
    ],
  },
  {
    id: "five-ways-use-box",
    image: "https://i.postimg.cc/kCkc7qpb/IMG-9263.png",
    title: "5 Ways to Use Your Box Before Anything Wilts", titleAr: "٥ طرق لاستخدام صندوقك قبل أن يذبل أي شيء",
    date: "2026-07-01",
    excerpt: "Practical ideas for turning a full box of fresh produce into meals, fast — with recipes to match.",
    excerptAr: "أفكار عملية لتحويل صندوق مليء بالمنتجات الطازجة إلى وجبات، بسرعة — مع وصفات مطابقة.",
    body: [
      "1. Chop hardy vegetables (carrots, beetroot, cauliflower) the day they arrive — they keep just as well pre-cut and it saves real time mid-week.",
      "2. Herbs wilt fastest — use parsley, mint and coriander in the first two days. Our Tabbouleh and Fattoush recipes are built exactly for this.",
      "3. Anything close to overripe (soft tomatoes, very ripe cucumber) is perfect for a quick sauce or soup base, not the bin.",
      "4. Roast a tray of whatever's left on day 4 or 5 — our Roasted Mediterranean Vegetables recipe works with almost any combination.",
      "5. Check the Recipes page before you order — it shows you exactly what's needed for each dish, so nothing gets bought and forgotten.",
    ],
    bodyAr: [
      "١. قطّعي الخضروات الصلبة (الجزر، الشمندر، القرنبيط) في يوم وصولها — تبقى جيدة حتى وهي مقطّعة مسبقًا وهذا يوفر وقتًا حقيقيًا في منتصف الأسبوع.",
      "٢. الأعشاب تذبل أسرع — استخدمي البقدونس والنعناع والكزبرة في أول يومين. وصفات التبولة والفتوش لدينا مصممة خصيصًا لهذا.",
      "٣. أي شيء قريب من النضج الزائد (طماطم طرية، خيار ناضج جدًا) مثالي لصلصة سريعة أو قاعدة شوربة، وليس سلة المهملات.",
      "٤. اشوي صينية مما تبقى في اليوم الرابع أو الخامس — وصفة الخضروات المتوسطية المشوية لدينا تعمل مع أي تركيبة تقريبًا.",
      "٥. تحققي من صفحة الوصفات قبل الطلب — فهي تُظهر لكِ بالضبط ما تحتاجينه لكل طبق، حتى لا يُشترى شيء ويُنسى.",
    ],
  },
  {
    id: "farm-to-door",
    image: "https://i.postimg.cc/hnHrKc57/IMG-9265.png",
    title: "Same-Day, Farm to Door: How the Sourcing Actually Works", titleAr: "من المزرعة إلى الباب في نفس اليوم: كيف يعمل التوريد فعليًا",
    date: "2026-07-10",
    excerpt: "A behind-the-scenes look at how produce moves from sourcing to your doorstep, the same day.",
    excerptAr: "نظرة من الكواليس على كيفية انتقال المنتجات من التوريد إلى بابك، في نفس اليوم.",
    body: [
      "Every order that comes in is hand-sorted the same day it ships. Nothing sits pre-bagged in a warehouse waiting for a delivery slot days later.",
      "For our commercial and wholesale customers, this goes a step further — every carton is batch-numbered and QR-coded, so a kitchen team can trace exactly what's inside and when it was packed.",
      "That same standard of care carries into every household box too, even if you never see the batch number yourself. It's the same produce, the same process, just smaller quantities.",
    ],
    bodyAr: [
      "كل طلب يصل يُفرز يدويًا في نفس يوم شحنه. لا شيء يجلس معبأً مسبقًا في مستودع بانتظار موعد توصيل بعد أيام.",
      "بالنسبة لعملائنا التجاريين وعملاء الجملة، يذهب هذا خطوة أبعد — كل كرتونة تحمل رقم دفعة ورمز QR، بحيث يمكن لفريق المطبخ تتبع ما بداخلها بالضبط ومتى تم تعبئتها.",
      "نفس مستوى العناية هذا ينتقل إلى كل صندوق منزلي أيضًا، حتى لو لم ترَ رقم الدفعة بنفسك أبدًا. إنه نفس المنتج، ونفس العملية، فقط بكميات أصغر.",
    ],
  },
];

const RECIPE_META = {
  "fattoush": { time: 15, level: "Easy", levelAr: "سهل", servings: "2–4" },
  "tabbouleh": { time: 20, level: "Easy", levelAr: "سهل", servings: "2–4" },
  "molokhia": { time: 35, level: "Medium", levelAr: "متوسط", servings: "3–4" },
  "warak-enab": { time: 60, level: "Medium", levelAr: "متوسط", servings: "4–6" },
  "roasted-veg": { time: 35, level: "Easy", levelAr: "سهل", servings: "3–4" },
  "greek-salad": { time: 10, level: "Easy", levelAr: "سهل", servings: "2–4" },
  "baba-ghanoush": { time: 25, level: "Easy", levelAr: "سهل", servings: "3–4" },
  "shakshuka": { time: 20, level: "Easy", levelAr: "سهل", servings: "2–3" },
  "cucumber-yogurt": { time: 10, level: "Easy", levelAr: "سهل", servings: "2–4" },
  "roasted-cauliflower": { time: 30, level: "Easy", levelAr: "سهل", servings: "2–4" },
  "lentil-soup": { time: 35, level: "Easy", levelAr: "سهل", servings: "4" },
  "sauteed-spinach": { time: 10, level: "Easy", levelAr: "سهل", servings: "2–3" },
  "loubieh": { time: 40, level: "Easy", levelAr: "سهل", servings: "3–4" },
  "roasted-beetroot": { time: 40, level: "Easy", levelAr: "سهل", servings: "2–4" },
  "mushroom-saute": { time: 12, level: "Easy", levelAr: "سهل", servings: "2–3" },
  "sweet-potato-wedges": { time: 30, level: "Easy", levelAr: "سهل", servings: "2–4" },
  "garlic-broccoli": { time: 20, level: "Easy", levelAr: "سهل", servings: "2–3" },
  "ratatouille": { time: 45, level: "Medium", levelAr: "متوسط", servings: "3–4" },
  "borscht": { time: 50, level: "Medium", levelAr: "متوسط", servings: "4–6" },
  "olivier-salad": { time: 30, level: "Easy", levelAr: "سهل", servings: "4–5" },
  "mjadara": { time: 40, level: "Easy", levelAr: "سهل", servings: "3–4" },
  "foul-medames": { time: 15, level: "Easy", levelAr: "سهل", servings: "2–3" },
  "minestrone": { time: 40, level: "Easy", levelAr: "سهل", servings: "4–6" },
  "coleslaw": { time: 15, level: "Easy", levelAr: "سهل", servings: "4" },
  "vinegret": { time: 45, level: "Medium", levelAr: "متوسط", servings: "4–5" },
  "draniki": { time: 30, level: "Easy", levelAr: "سهل", servings: "2–3" },
};

function IngredientThumb({ product, size }) {
  const photo = product ? (product.photoUrl || REAL_PHOTOS[product.id]) : null;
  if (photo) {
    return <img src={photo} alt={product.name} style={{ width: size, height: size, objectFit: "cover", borderRadius: 10, display: "block" }} />;
  }
  return (
    <div style={{ width: size, height: size, borderRadius: 10, background: BRAND.creamDeep, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <ProduceIcon name={product ? product.name : ""} category={product ? product.category : ""} size={size * 0.6} />
    </div>
  );
}

function RecipesView({ setView, products, addToCart, deepLinkRecipeId }) {
  const { lang } = useLang();
  const [openId, setOpenId] = useState(null);
  const [highlightId, setHighlightId] = useState(deepLinkRecipeId || null);
  const isAr = lang === "ar";

  useEffect(() => {
    if (!deepLinkRecipeId) return;
    // Give the grid a moment to render before scrolling to it.
    const t = setTimeout(() => {
      const el = document.getElementById(`recipe-${deepLinkRecipeId}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
    const clear = setTimeout(() => setHighlightId(null), 3500); // fade the highlight after a few seconds
    return () => { clearTimeout(t); clearTimeout(clear); };
  }, [deepLinkRecipeId]);

  function findProduct(name) {
    return products.find((p) => p.name === name);
  }

  function addAllToCart(recipe) {
    recipe.produce.forEach((name) => {
      const p = findProduct(name);
      if (!p || !isOrderable(p)) return; // skip anything out of stock instead of adding it silently
      addToCart({ id: p.id, name: p.name, unit: p.unit, price: effectivePrice(p), qty: 1, kind: "item" });
    });
  }

  function isOrderable(p) {
    if (!p.available) return false;
    if (typeof p.stock === "number" && p.stock <= 0) return false;
    return true;
  }

  return (
    <div style={{ paddingTop: 22 }}>
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <SectionTitle eyebrow={isAr ? "من مطبخنا" : "From Our Kitchen"} title={isAr ? "وصفات تحتاج فيها إلى منتجاتنا" : "Recipes, mapped to what we actually sell"} />
        <GhostButton onClick={() => window.print()}>🖨 {isAr ? "طباعة كل الوصفات" : "Print all recipes"}</GhostButton>
      </div>
      <p className="no-print" style={{ fontSize: 13.5, opacity: 0.7, marginTop: 8, maxWidth: 640 }}>
        {isAr
          ? "كل وصفة تعرض بالضبط الخضروات والأعشاب الطازجة التي تحتاجها — وكلها متوفرة للطلب مباشرة."
          : "Every recipe lists exactly the fresh produce you'll need — all of it orderable right here."}
      </p>

      <div className="dsf-recipe-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px,1fr))", gap: 20, marginTop: 24 }}>
        {RECIPES.map((r) => {
          const meta = RECIPE_META[r.id] || { time: 20, level: "Easy", levelAr: "سهل", servings: "2–4" };
          return (
            <div
              key={r.id}
              id={`recipe-${r.id}`}
              style={{
                background: "#fff", borderRadius: 16, overflow: "hidden", breakInside: "avoid",
                border: `1px solid ${highlightId === r.id ? BRAND.gold : BRAND.creamDeep}`,
                boxShadow: highlightId === r.id ? `0 0 0 3px ${BRAND.gold}55` : "none",
                transition: "box-shadow 0.6s ease, border-color 0.6s ease",
                scrollMarginTop: 90,
              }}
              className="dsf-recipe-card"
            >
              {/* Branded header */}
              <div style={{ background: `linear-gradient(160deg, ${BRAND.green}, ${BRAND.greenDark})`, color: "#fff", padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <img src={REAL_LOGO_IMG} alt="Darousha Fresh" style={{ height: 22, borderRadius: 3 }} />
                </div>
                <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 800, fontSize: 22, lineHeight: 1.2 }}>{isAr ? r.nameAr : r.name}</div>
                <div style={{ fontSize: 12.5, opacity: 0.85, fontStyle: "italic", marginTop: 4 }}>{isAr ? r.taglineAr : r.tagline}</div>
                <div style={{ display: "flex", gap: 16, marginTop: 14, fontSize: 11, fontWeight: 700, opacity: 0.92 }}>
                  <span>⏱ {meta.time} {isAr ? "دقيقة" : "min"}</span>
                  <span>📊 {isAr ? meta.levelAr : meta.level}</span>
                  <span>👥 {meta.servings} {isAr ? "أشخاص" : "servings"}</span>
                </div>
              </div>

              <div style={{ padding: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", color: BRAND.orangeDeep, textTransform: "uppercase", marginBottom: 10 }}>
                  {isAr ? "المكوّنات" : "Ingredients"}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(70px,1fr))", gap: 10, marginBottom: 16 }}>
                  {r.produce.map((name) => {
                    const p = findProduct(name);
                    const orderable = p ? isOrderable(p) : true;
                    return (
                      <div key={name} style={{ textAlign: "center", opacity: orderable ? 1 : 0.45 }}>
                        <IngredientThumb product={p} size={58} />
                        <div style={{ fontSize: 10, fontWeight: 700, marginTop: 5, lineHeight: 1.25 }}>{p ? prodName(p.name, lang) : name}</div>
                        {p && orderable && (
                          <div style={{ fontSize: 9, opacity: 0.55 }}>
                            {effectivePrice(p) !== p.price && (
                              <span style={{ textDecoration: "line-through", marginInlineEnd: 3 }}>{money(p.price)}</span>
                            )}
                            {money(effectivePrice(p))}
                          </div>
                        )}
                        {p && !orderable && (
                          <div style={{ fontSize: 9, color: BRAND.tomato, fontWeight: 700 }}>
                            {lang === "ar" ? "غير متوفر" : "Out of stock"}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 16 }}>
                  <b>{isAr ? "من مطبخك:" : "From your pantry:"}</b> {(isAr ? r.pantryAr : r.pantry).join(" · ")}
                </div>

                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", color: BRAND.orangeDeep, textTransform: "uppercase", marginBottom: 10 }}>
                  {isAr ? "طريقة التحضير" : "How to make it"}
                </div>
                <ol style={{ margin: 0, paddingInlineStart: 18, fontSize: 12.5, lineHeight: 1.85, opacity: 0.82 }}>
                  {(isAr ? r.stepsAr : r.steps).map((s, i) => <li key={i} style={{ marginBottom: 4 }}>{s}</li>)}
                </ol>

                <div className="no-print" style={{ marginTop: 16 }}>
                  <PrimaryButton onClick={() => addAllToCart(r)} full>
                    {isAr ? "أضف كل المكونات للسلة" : "Add all ingredients"}
                  </PrimaryButton>
                  {r.produce.some((name) => { const p = findProduct(name); return p && !isOrderable(p); }) && (
                    <div style={{ fontSize: 11, color: BRAND.tomato, marginTop: 6, textAlign: "center" }}>
                      {isAr ? "بعض المكونات غير متوفرة حاليًا ولن تُضاف" : "Some ingredients are currently out of stock and won't be added"}
                    </div>
                  )}
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      isAr
                        ? `جرّبي وصفة "${r.nameAr}" من Darousha Fresh — كل المكونات طازجة وجاهزة للطلب: ${SITE_URL}/?view=recipes&recipe=${r.id}`
                        : `Try this "${r.name}" recipe from Darousha Fresh — every ingredient is fresh and ready to order: ${SITE_URL}/?view=recipes&recipe=${r.id}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "#25D366", color: "#fff", fontWeight: 700, fontSize: 13, padding: "10px 14px", borderRadius: 10, textDecoration: "none", marginTop: 10 }}
                  >
                    <Phone size={14} /> {isAr ? "شارك الوصفة عبر واتساب" : "Share recipe on WhatsApp"}
                  </a>
                </div>
              </div>

              {/* Branded footer with QR code */}
              <div style={{ background: BRAND.cream, borderTop: `1px solid ${BRAND.creamDeep}`, padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(SITE_URL + "/?view=recipes&recipe=" + r.id)}`}
                  alt="QR code to this recipe"
                  width={62} height={62}
                  style={{ borderRadius: 6, background: "#fff", padding: 3 }}
                />
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: BRAND.green }}>{isAr ? "المزيد من الوصفات" : "More recipes, more inspiration"}</div>
                  <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>{isAr ? "امسح الرمز لاكتشاف وصفات جديدة" : "Scan to discover more recipes"}</div>
                  <div style={{ fontSize: 10, opacity: 0.6, marginTop: 4 }}>WhatsApp {formatPhoneDisplay(WHATSAPP_NUMBER)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="no-print" style={{ textAlign: "center", marginTop: 28 }}>
        <GhostButton onClick={() => setView("boxes")}><ArrowLeft size={15} /> {isAr ? "العودة للصناديق" : "Back to boxes"}</GhostButton>
      </div>
    </div>
  );
}


function BlogView({ setView }) {
  const { lang } = useLang();
  const [openId, setOpenId] = useState(null);
  const isAr = lang === "ar";
  const sorted = [...BLOG_POSTS].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div style={{ paddingTop: 30, maxWidth: 680, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
        <Logo size={90} />
      </div>
      <SectionTitle eyebrow={isAr ? "من داروشة فريش" : "From Darousha Fresh"} title={isAr ? "المدونة" : "Blog"} />

      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 22 }}>
        {sorted.map((post) => {
          const open = openId === post.id;
          return (
            <div key={post.id} style={{ background: "#fff", border: "1px solid rgba(198,162,76,0.22)", boxShadow: "0 2px 10px rgba(35,31,22,0.05)", borderRadius: 14, overflow: "hidden" }}>
              {post.image && (
                <img src={post.image} alt={isAr ? post.titleAr : post.title} style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }} />
              )}
              <div style={{ padding: 20 }}>
              <div style={{ fontSize: 11.5, opacity: 0.5, marginBottom: 4 }}>
                {new Date(post.date).toLocaleDateString(isAr ? "ar" : "en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </div>
              <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 19 }}>{isAr ? post.titleAr : post.title}</div>
              {!open && <p style={{ fontSize: 13.5, opacity: 0.72, marginTop: 8, lineHeight: 1.6 }}>{isAr ? post.excerptAr : post.excerpt}</p>}
              {open && (
                <div style={{ marginTop: 12 }}>
                  {(isAr ? post.bodyAr : post.body).map((para, i) => (
                    <p key={i} style={{ fontSize: 14, opacity: 0.82, lineHeight: 1.8, marginBottom: 10 }}>{para}</p>
                  ))}
                </div>
              )}
              <button
                onClick={() => setOpenId(open ? null : post.id)}
                style={{ background: "none", border: "none", color: BRAND.green, fontWeight: 700, fontSize: 13, cursor: "pointer", padding: 0, marginTop: 10, display: "flex", alignItems: "center", gap: 4 }}
              >
                {open ? (isAr ? "إغلاق" : "Close") : (isAr ? "قراءة المزيد" : "Read more")} <ChevronRight size={14} style={{ transform: open ? "rotate(90deg)" : "none" }} />
              </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ textAlign: "center", marginTop: 28 }}>
        <GhostButton onClick={() => setView("home")}><ArrowLeft size={15} /> {isAr ? "العودة للرئيسية" : "Back home"}</GhostButton>
      </div>
    </div>
  );
}

function AboutView({ setView }) {
  return (
    <div style={{ paddingTop: 40, maxWidth: 680, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
        <Logo size={100} />
      </div>
      <SectionTitle eyebrow="Our story" title="About Darousha Fresh" />
      <div style={{ marginTop: 16, fontSize: 14.5, lineHeight: 1.8, opacity: 0.85 }}>
        <p>
          Darousha Fresh started with a simple promise: vegetables that taste like they were picked this morning, because they were. Every order is hand-sorted the same day it ships — nothing sits in a warehouse, nothing is pre-bagged and forgotten.
        </p>
        <p style={{ marginTop: 14 }}>
          <b>What makes us different isn't the box — it's who packs it.</b> Every order is hand-picked by a member of our Personal Shopper team, the same way you'd want a trusted friend to shop for you: choosing the ripest tomatoes, the firmest peppers, skipping anything that isn't good enough for your table. No warehouse robot ever touches your order.
        </p>
        <p style={{ marginTop: 14 }}>
          We work directly with growers we trust, which is why every bag of onions or bulb of garlic carries the same green-and-gold seal — our word that what's inside is fresh, sorted by hand, and ready for your kitchen.
        </p>
        <p style={{ marginTop: 14 }}>
          From a simple Daily Box for one, to a Signature gift box for entertaining, to a bulk Chef's Box for catering — we pack for how you actually cook and serve, not a one-size-fits-all crate.
        </p>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 22 }}>
        {["Premium Quality", "Fresh Every Day", "Personal Shopper", "On Time Delivery"].map((b) => (
          <span key={b} style={{ fontSize: 12.5, border: `1px solid ${BRAND.gold}`, color: BRAND.orangeDeep, borderRadius: 999, padding: "6px 14px", fontWeight: 700 }}>
            {b}
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 28, flexWrap: "wrap" }}>
        <PrimaryButton onClick={() => setView("boxes")}>Choose a box <ChevronRight size={16} /></PrimaryButton>
        <GhostButton onClick={() => setView("home")}><ArrowLeft size={15} /> Back home</GhostButton>
      </div>
    </div>
  );
}

function PrivacyView({ setView }) {
  const { lang } = useLang();
  const isAr = lang === "ar";
  return (
    <div style={{ paddingTop: 40, maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
        <Logo size={200} />
      </div>
      <h2 style={{ fontFamily: "Playfair Display, serif", marginTop: 8, textAlign: "center" }}>{isAr ? "سياسة الخصوصية" : "Privacy Policy"}</h2>
      <p style={{ textAlign: "center", fontSize: 12, opacity: 0.6, marginBottom: 12 }}>{isAr ? "آخر تحديث: يوليو ٢٠٢٦" : "Last updated: July 2026"}</p>
      <div style={{ textAlign: isAr ? "right" : "left", background: "#fff", border: "1px solid rgba(198,162,76,0.22)", boxShadow: "0 2px 10px rgba(35,31,22,0.05)", borderRadius: 14, padding: 24, fontSize: 13.5, lineHeight: 1.75, opacity: 0.9 }}>
        {isAr ? (
          <>
            <p>تحترم Darousha Fresh خصوصيتك. توضح هذه السياسة ما نجمعه، وكيف نستخدمه، ومن نشاركه معه.</p>
            <p><b>المعلومات التي نجمعها:</b> الاسم ورقم الهاتف والبريد الإلكتروني وعنوان التوصيل والمنطقة، وموقعك الجغرافي عند استخدامه لتحديد التوصيل، وتفاصيل الطلبات وسجلها، ونقاط الولاء، وأي صور أو نصوص تقدمها في التقييمات، وتفضيلات الاشتراك المتكرر.</p>
            <p><b>الدفع:</b> بيانات البطاقة المُدخلة عند الدفع لا تتم معالجتها أو تخزينها فعليًا من قبل Darousha Fresh في الوقت الحالي؛ الدفع نقدًا عند التوصيل هو الطريقة الفعلية المعمول بها.</p>
            <p><b>كيف نستخدم بياناتك:</b> لتجهيز طلباتك وتوصيلها وتتبعها، لإدارة حسابك ونقاط الولاء واشتراكاتك، للتواصل معك بخصوص الطلبات، ولعرض تقييماتك المعتمدة على الموقع.</p>
            <p><b>مقدمو الخدمات الخارجيون:</b> نستخدم Firebase (Google) لتخزين الحسابات والطلبات والصور بأمان، وEmailJS لإرسال إشعارات البريد الإلكتروني، وCallMeBot لإرسال إشعارات واتساب التلقائية. تخضع هذه الخدمات لسياسات الخصوصية الخاصة بها.</p>
            <p><b>المشاركة:</b> لا نبيع بياناتك لأي جهة. تتم مشاركة تفاصيل التوصيل فقط مع فريق التوصيل لغرض إتمام طلبك.</p>
            <p><b>الاحتفاظ بالبيانات وحقوقك:</b> يمكنك طلب حذف حسابك وبياناتك في أي وقت بالتواصل معنا عبر واتساب أو البريد الإلكتروني أدناه.</p>
            <p><b>الأطفال:</b> خدماتنا غير موجهة للأطفال دون سن ١٣ عامًا، ولا نجمع بياناتهم عمدًا.</p>
            <p><b>التغييرات:</b> قد نحدّث هذه السياسة من وقت لآخر، وسيظهر أي تحديث على هذه الصفحة.</p>
            <p><b>تواصل معنا:</b> لأي استفسار بخصوص خصوصيتك، تواصل معنا عبر واتساب على {formatPhoneDisplay(WHATSAPP_NUMBER)} أو عبر البريد الإلكتروني {BUSINESS_EMAIL}.</p>
          </>
        ) : (
          <>
            <p>Darousha Fresh respects your privacy. This policy explains what we collect, how we use it, and who we share it with.</p>
            <p><b>Information we collect:</b> your name, phone number, email, delivery address and area, your location when used to pin your delivery, your order details and history, loyalty points, any photos or text you submit in reviews, and your recurring-order preferences.</p>
            <p><b>Payment:</b> card details entered at checkout are not actually processed or stored by Darousha Fresh at this time — cash on delivery is the payment method actually in effect.</p>
            <p><b>How we use your data:</b> to prepare, deliver, and track your orders, to manage your account, loyalty points, and subscriptions, to contact you about your orders, and to display your approved reviews on the site.</p>
            <p><b>Third-party services we use:</b> Firebase (Google) to securely store accounts, orders, and photos; EmailJS to send email notifications; and CallMeBot to send automatic WhatsApp alerts. These services have their own privacy policies governing how they handle data on our behalf.</p>
            <p><b>Sharing:</b> we do not sell your information. Delivery details are shared only with our delivery team, solely to complete your order.</p>
            <p><b>Data retention & your rights:</b> you can request deletion of your account and data at any time by contacting us via WhatsApp or email below.</p>
            <p><b>Children:</b> our services are not directed at children under 13, and we do not knowingly collect their data.</p>
            <p><b>Changes:</b> we may update this policy from time to time; any changes will appear on this page.</p>
            <p><b>Contact us:</b> for any privacy questions, reach us on WhatsApp at {formatPhoneDisplay(WHATSAPP_NUMBER)} or by email at {BUSINESS_EMAIL}.</p>
          </>
        )}
      </div>
      <div style={{ textAlign: "center" }}>
        <GhostButton onClick={() => setView("home")} style={{ marginTop: 20 }}><ArrowLeft size={15} /> {isAr ? "العودة للرئيسية" : "Back home"}</GhostButton>
      </div>
    </div>
  );
}

/* ------------------------------------ Admin / Backstage ------------------------------------ */

/* ------------------------------------ Account (sign up / sign in / order history) ------------------------------------ */

function MySubscriptions({ uid, lang }) {
  const [allSubs, setAllSubs] = useState([]);

  useEffect(() => {
    const unsub = subscribeToUserSubscriptions(uid, setAllSubs);
    return unsub;
  }, [uid]);

  const subs = allSubs.filter((s) => s.status !== "cancelled");
  if (subs.length === 0) return null; // nothing to show if they've never subscribed (or cancelled everything)

  const freqLabel = { weekly: lang === "ar" ? "أسبوعيًا" : "Weekly", biweekly: lang === "ar" ? "كل أسبوعين" : "Every 2 weeks", monthly: lang === "ar" ? "شهريًا" : "Monthly" };

  return (
    <div style={{ background: "#fff", border: "1px solid rgba(198,162,76,0.22)", boxShadow: "0 2px 10px rgba(35,31,22,0.05)", borderRadius: 14, padding: 18, marginTop: 16 }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>🔁 {lang === "ar" ? "اشتراكاتي" : "My Subscriptions"}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
        {subs.map((s) => (
          <div key={s.id} style={{ border: "1px solid rgba(198,162,76,0.22)", boxShadow: "0 2px 10px rgba(35,31,22,0.05)", borderRadius: 10, padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  {(s.items || []).map((it) => it.name).join(", ")}
                </div>
                <div style={{ fontSize: 12, opacity: 0.65, marginTop: 2 }}>
                  {freqLabel[s.frequency]} · {lang === "ar" ? "التوصيل التالي" : "Next delivery"}: {new Date(s.nextDeliveryDate).toLocaleDateString()}
                </div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 999,
                background: s.status === "active" ? BRAND.greenSoft : "#F2D9CE",
                color: s.status === "active" ? BRAND.green : BRAND.orangeDeep,
              }}>
                {s.status === "active" ? (lang === "ar" ? "نشط" : "Active") : (lang === "ar" ? "متوقف" : "Paused")}
              </span>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              {s.status === "active" ? (
                <GhostButton onClick={() => updateSubscriptionDoc(s.id, { status: "paused" })} style={{ fontSize: 12, padding: "6px 12px" }}>
                  {lang === "ar" ? "إيقاف مؤقت" : "Pause"}
                </GhostButton>
              ) : (
                <GhostButton onClick={() => updateSubscriptionDoc(s.id, { status: "active" })} style={{ fontSize: 12, padding: "6px 12px" }}>
                  {lang === "ar" ? "استئناف" : "Resume"}
                </GhostButton>
              )}
              <button
                onClick={() => window.confirm(lang === "ar" ? "إلغاء هذا الاشتراك نهائيًا؟" : "Cancel this subscription for good?") && updateSubscriptionDoc(s.id, { status: "cancelled" })}
                style={{ background: "none", border: "none", color: BRAND.tomato, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AccountView({ user, profile, authLoading, orders, setView, onProfileSaved, onTrackOrder, onReorder }) {
  const { t, lang } = useLang();
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const statusKeyMap = { placed: "status_placed", preparing: "status_preparing", out_for_delivery: "status_out", delivered: "status_delivered" };

  if (authLoading) {
    return <div style={{ paddingTop: 60, textAlign: "center", opacity: 0.6 }}>Loading…</div>;
  }

  if (!user) {
    return (
      <div style={{ paddingTop: 40, maxWidth: 380, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
          <UserIcon size={30} color={BRAND.green} />
        </div>
        <SectionTitle eyebrow={t("account_eyebrow")} title={mode === "signin" ? t("sign_in_title") : t("sign_up_title")} />
        <div style={{ display: "flex", gap: 8, margin: "16px 0" }}>
          <Pill active={mode === "signin"} onClick={() => setMode("signin")}>{t("sign_in")}</Pill>
          <Pill active={mode === "signup"} onClick={() => setMode("signup")}>{t("sign_up")}</Pill>
        </div>
        {mode === "signin" ? <SignInForm /> : <SignUpForm />}
      </div>
    );
  }

  const myOrders = orders.filter((o) => o.customer && o.customer.uid === user.uid);

  return (
    <div style={{ paddingTop: 30, maxWidth: 520, margin: "0 auto" }}>
      <SectionTitle eyebrow={t("account_eyebrow")} title={profile?.name ? `${lang === "ar" ? "مرحبًا" : "Hi"}, ${profile.name}` : t("account_eyebrow")} />

      <div style={{ background: BRAND.greenSoft, borderRadius: 14, padding: 18, marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: BRAND.green, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {lang === "ar" ? "نقاط الولاء" : "Loyalty Points"}
          </div>
          <div style={{ fontSize: 11.5, opacity: 0.7, marginTop: 2 }}>
            {lang === "ar" ? "١ نقطة = ١ درهم عند الطلب التالي" : "1 point = AED 1 off your next order"}
          </div>
        </div>
        <div style={{ fontFamily: "IBM Plex Mono, monospace", fontWeight: 800, fontSize: 28, color: BRAND.green }}>
          {profile?.loyaltyPoints || 0}
        </div>
      </div>

      <MySubscriptions uid={user.uid} lang={lang} />

      <div style={{ background: "#fff", border: "1px solid rgba(198,162,76,0.22)", boxShadow: "0 2px 10px rgba(35,31,22,0.05)", borderRadius: 14, padding: 18, marginTop: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Mail size={15} color={BRAND.green} />
          <div style={{ fontSize: 13.5 }}>{user.email}</div>
        </div>
        {profile?.phone && <div style={{ fontSize: 13, opacity: 0.7 }}>{profile.phone}</div>}
        {profile?.address && <div style={{ fontSize: 13, opacity: 0.7 }}>{profile.address}{profile.area ? `, ${localArea(profile.area, lang)}` : ""}</div>}
        <div style={{ fontSize: 11.5, opacity: 0.55, marginTop: 10 }}>
          {t("saved_note")}
        </div>
        <GhostButton
          style={{ marginTop: 14 }}
          onClick={() => signOut(auth)}
        >
          <LogOut size={15} /> {t("sign_out")}
        </GhostButton>
      </div>

      <div style={{ marginTop: 20, background: BRAND.greenSoft, borderRadius: 14, padding: 18 }}>
        <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 16, color: BRAND.green }}>
          {lang === "ar" ? "🎁 أحِل صديقًا، وفّرا معًا" : "🎁 Give AED 15, Get AED 15"}
        </div>
        <p style={{ fontSize: 12.5, opacity: 0.75, marginTop: 6, lineHeight: 1.6 }}>
          {lang === "ar"
            ? "شارك كودك مع صديق — يحصل على خصم AED 15 على طلبه الأول، ونكافئك أنت أيضًا."
            : "Share your code with a friend — they get AED 15 off their first order, and we'll reward you too."}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
          <div style={{ fontFamily: "IBM Plex Mono, monospace", fontWeight: 800, fontSize: 16, background: "#fff", borderRadius: 8, padding: "8px 14px", color: BRAND.green }}>
            {referralCodeFor(user.uid, profile?.name)}
          </div>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              lang === "ar"
                ? `جرب Darousha Fresh! استخدم الكود ${referralCodeFor(user.uid, profile?.name)} واحصل على خصم AED 15 على طلبك الأول: ${SITE_URL}`
                : `Try Darousha Fresh! Use code ${referralCodeFor(user.uid, profile?.name)} for AED 15 off your first order: ${SITE_URL}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#25D366", color: "#fff", fontWeight: 700, fontSize: 12.5, padding: "9px 14px", borderRadius: 8, textDecoration: "none" }}
          >
            <Phone size={13} /> {lang === "ar" ? "شارك عبر واتساب" : "Share on WhatsApp"}
          </a>
        </div>
      </div>

      <div style={{ marginTop: 28 }}>
        <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 18, marginBottom: 12 }}>{t("your_orders")}</div>
        {myOrders.length === 0 && <div style={{ opacity: 0.6, fontSize: 14 }}>{t("no_orders_yet")}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {myOrders.map((o) => {
            const stepIndex = STATUS_STEPS.findIndex((s) => s.key === o.status);
            const step = STATUS_STEPS[stepIndex];
            return (
              <div key={o.id} style={{ background: "#fff", border: "1px solid rgba(198,162,76,0.22)", boxShadow: "0 2px 10px rgba(35,31,22,0.05)", borderRadius: 12, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontFamily: "IBM Plex Mono, monospace", fontWeight: 700, fontSize: 13.5 }}>{o.id}</div>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{money(o.total)}</div>
                </div>
                <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
                  {o.items.map((it) => it.breakdown && it.breakdown.length > 0 ? `${it.name} ×${it.qty} (${breakdownText(it, lang)})` : `${it.name} ×${it.qty}`).join(", ")}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: BRAND.green }}>
                    {step ? t(statusKeyMap[step.key]) : t("status_placed")}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <GhostButton style={{ padding: "6px 12px", fontSize: 12.5 }} onClick={() => onReorder(o)}>
                      {lang === "ar" ? "إعادة الطلب" : "Reorder"}
                    </GhostButton>
                    <GhostButton style={{ padding: "6px 12px", fontSize: 12.5 }} onClick={() => onTrackOrder(o.id)}>
                      <Truck size={13} /> {t("track_btn")}
                    </GhostButton>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SignInForm() {
  const { t } = useLang();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState("signin"); // "signin" | "reset"
  const [resetSent, setResetSent] = useState(false);

  async function submit() {
    setError("");
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e) {
      setError(friendlyAuthError(e));
    }
    setBusy(false);
  }

  async function submitReset() {
    setError("");
    setBusy(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      // Always show the same success message regardless of whether the
      // email actually matched an account — confirming or denying an
      // account's existence here would let someone probe for registered
      // emails, so Firebase's own "not found" error is deliberately treated
      // the same as success from the customer's point of view.
      setResetSent(true);
    } catch (e) {
      if (e && e.code === "auth/user-not-found") {
        setResetSent(true);
      } else {
        setError(friendlyAuthError(e));
      }
    }
    setBusy(false);
  }

  if (mode === "reset") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{t("reset_password_title")}</div>
        {resetSent ? (
          <div style={{ fontSize: 13, color: BRAND.green, lineHeight: 1.6 }}>{t("reset_link_sent")}</div>
        ) : (
          <>
            <div style={{ fontSize: 12.5, opacity: 0.7, lineHeight: 1.5 }}>{t("reset_password_prompt")}</div>
            <Field label={t("email")}><input type="email" style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></Field>
            {error && <div style={{ color: BRAND.tomato, fontSize: 12.5 }}>{error}</div>}
            <PrimaryButton full disabled={!email.trim() || busy} onClick={submitReset}>
              {busy ? t("sending_reset_link") : t("send_reset_link")}
            </PrimaryButton>
          </>
        )}
        <GhostButton full onClick={() => { setMode("signin"); setResetSent(false); setError(""); }}>
          {t("back_to_sign_in")}
        </GhostButton>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Field label={t("email")}><input type="email" style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></Field>
      <Field label={t("password")}><input type="password" style={inputStyle} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" /></Field>
      <button
        onClick={() => { setMode("reset"); setError(""); }}
        style={{ background: "none", border: "none", color: BRAND.green, fontSize: 12.5, fontWeight: 700, cursor: "pointer", textAlign: "start", padding: 0, alignSelf: "flex-start" }}
      >
        {t("forgot_password")}
      </button>
      {error && <div style={{ color: BRAND.tomato, fontSize: 12.5 }}>{error}</div>}
      <PrimaryButton full disabled={!email.trim() || !password || busy} onClick={submit}>
        {busy ? t("signing_in") : t("sign_in")}
      </PrimaryButton>
    </div>
  );
}

function SignUpForm() {
  const { t } = useLang();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError("");
    setBusy(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(cred.user, { displayName: name });
      await saveProfile(cred.user.uid, { name, phone, email: email.trim() });
    } catch (e) {
      setError(friendlyAuthError(e));
    }
    setBusy(false);
  }

  const canSubmit = name.trim() && email.trim() && phone.trim() && password.length >= 6;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Field label={t("full_name")}><input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" /></Field>
      <Field label={t("email")}><input type="email" style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></Field>
      <Field label={t("phone_number")}><input style={inputStyle} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+971 5xx xxx xxx" /></Field>
      <Field label={t("password")}><input type="password" style={inputStyle} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" /></Field>
      {error && <div style={{ color: BRAND.tomato, fontSize: 12.5 }}>{error}</div>}
      <PrimaryButton full disabled={!canSubmit || busy} onClick={submit}>
        {busy ? t("creating_account") : t("create_account")}
      </PrimaryButton>
    </div>
  );
}

function friendlyAuthError(e) {
  const code = e && e.code ? e.code : "";
  console.error("Auth error:", code, e);
  if (code.includes("email-already-in-use")) return "That email already has an account — try signing in instead.";
  if (code.includes("invalid-email")) return "That email doesn't look right.";
  if (code.includes("weak-password")) return "Password needs to be at least 6 characters.";
  if (code.includes("wrong-password") || code.includes("invalid-credential")) return "Incorrect email or password.";
  if (code.includes("user-not-found")) return "No account found with that email.";
  if (code.includes("unauthorized-domain")) return "This website isn't authorized yet in Firebase — add it under Authentication → Settings → Authorized domains.";
  if (code.includes("network-request-failed")) return "Network error — check your connection and try again.";
  if (code.includes("operation-not-allowed")) return "Email/password sign-in isn't turned on yet — enable it in Firebase → Authentication → Sign-in method.";
  return code ? `Something went wrong (${code}). Please try again.` : "Something went wrong — please try again.";
}


function AdminLogin({ onSuccess }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function attempt() {
    if (!pw || busy) return;
    setBusy(true);
    setError(false);
    try {
      // Signing in for real (not just comparing a string) is what makes the
      // Firestore rules below actually mean something — the database can
      // now check "is this request really from the signed-in admin
      // account," which a client-side-only password check could never let
      // it verify.
      await signInWithEmailAndPassword(auth, ADMIN_EMAIL, pw);
      onSuccess();
    } catch (e) {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ paddingTop: 70, maxWidth: 340, margin: "0 auto", textAlign: "center" }}>
      <Lock size={30} color={BRAND.green} style={{ marginBottom: 10 }} />
      <h2 style={{ fontFamily: "Playfair Display, serif" }}>Backstage access</h2>
      <p style={{ fontSize: 13, opacity: 0.65, marginBottom: 16 }}>Enter the staff password to manage prices and orders.</p>
      <input
        type="password"
        value={pw}
        onChange={(e) => { setPw(e.target.value); setError(false); }}
        placeholder="Password"
        style={inputStyle}
        onKeyDown={(e) => e.key === "Enter" && attempt()}
      />
      {error && <div style={{ color: BRAND.tomato, fontSize: 12.5, marginTop: 8 }}>Incorrect password.</div>}
      <PrimaryButton full style={{ marginTop: 12, opacity: busy ? 0.6 : 1 }} onClick={attempt}>
        {busy ? "Checking…" : "Enter backstage"}
      </PrimaryButton>
    </div>
  );
}

function CallMeBotTestButton() {
  const [status, setStatus] = useState(null); // null | "sending" | "sent"

  function runTest() {
    setStatus("sending");
    const text = encodeURIComponent("Darousha Fresh test message from Backstage — if you got this, WhatsApp alerts are working!");
    const url = `https://api.callmebot.com/whatsapp.php?phone=${CALLMEBOT_PHONE}&text=${text}&apikey=${CALLMEBOT_APIKEY}`;
    const pixel = document.createElement("img");
    pixel.src = url;
    pixel.width = 1;
    pixel.height = 1;
    pixel.style.position = "absolute";
    pixel.style.left = "-9999px";
    pixel.alt = "";
    const cleanup = () => pixel.remove();
    // Note: onerror will fire even on a successful request, since CallMeBot's
    // response isn't real image data — that's expected and not a failure signal.
    pixel.onload = cleanup;
    pixel.onerror = cleanup;
    document.body.appendChild(pixel);
    setTimeout(cleanup, 15000);
    setStatus("sent");
  }

  return (
    <div style={{ background: "#fff", border: `1px solid ${BRAND.creamDeep}`, borderRadius: 12, padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
      <div style={{ fontSize: 13 }}>
        <div style={{ fontWeight: 700 }}>Test WhatsApp alert</div>
        <div style={{ opacity: 0.65, fontSize: 12 }}>
          {status === "sent" && "Request fired — check WhatsApp in the next minute."}
          {status === "sending" && "Sending…"}
          {!status && "Tap to fire a real test request."}
        </div>
      </div>
      <GhostButton onClick={runTest}>{status === "sending" ? "Sending…" : "Send test"}</GhostButton>
    </div>
  );
}

function useNewOrderAlert(orders) {
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );
  const audioCtxRef = useRef(null);
  const notifiedIdsRef = useRef(new Set()); // avoid spamming a native Notification for the same order repeatedly

  // Any order nobody has pressed "Receive" on yet — oldest first. Deliberately
  // ignores status entirely: an order sitting unacknowledged is the thing we
  // never want missed, regardless of what its delivery status says.
  const unacknowledged = orders
    .filter((o) => !o.acknowledgedAt)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  function ring() {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume(); // browsers can silently block audio until resumed
      // Three-pulse ring, alternating two tones — much harder to miss than a
      // single short beep, closer to an actual phone/alert ring.
      const pulses = [
        { freq: 988, start: 0.0 },
        { freq: 784, start: 0.28 },
        { freq: 988, start: 0.56 },
        { freq: 784, start: 0.84 },
      ];
      pulses.forEach(({ freq, start }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.value = freq;
        const t0 = ctx.currentTime + start;
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.exponentialRampToValueAtTime(0.4, t0 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.24);
        osc.start(t0);
        osc.stop(t0 + 0.26);
      });
    } catch {}
  }

  // Keep ringing every few seconds — like a phone call, not a chime — for
  // as long as any order remains unacknowledged. Fires immediately on
  // mount too, so opening Backstage to a backlog of unreceived orders
  // rings right away instead of waiting for the next new one.
  useEffect(() => {
    if (unacknowledged.length === 0) return;
    ring();
    const interval = setInterval(ring, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unacknowledged.length > 0]);

  useEffect(() => {
    if (unacknowledged.length === 0 || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    unacknowledged.forEach((o) => {
      if (notifiedIdsRef.current.has(o.id)) return;
      notifiedIdsRef.current.add(o.id);
      new Notification("New Darousha Fresh order", { body: `${o.id} — ${money(o.total)}` });
    });
  }, [unacknowledged]);

  function requestNotifPermission() {
    if (typeof Notification === "undefined") return;
    Notification.requestPermission().then(setNotifPermission);
    // Also unlocks/creates the AudioContext during this real user click, so
    // the ring is far more likely to actually play on the next new order.
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
    } catch {}
  }

  return { unacknowledged, notifPermission, requestNotifPermission, testRing: ring };
}

// Keeps the screen from locking while Backstage is open, so the ring above
// can't be silently missed because the iPad went to sleep. Best-effort:
// not every browser supports the Wake Lock API, and iOS can still release
// it if the tab is backgrounded — there's no way around that from a website.
function useWakeLock(active) {
  const lockRef = useRef(null);

  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let cancelled = false;
    async function acquire() {
      try {
        const lock = await navigator.wakeLock.request("screen");
        if (cancelled) { lock.release(); return; }
        lockRef.current = lock;
      } catch {
        // permission denied, unsupported, or battery saver — fail silently
      }
    }
    acquire();
    function onVisible() {
      if (document.visibilityState === "visible" && !lockRef.current) acquire();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      if (lockRef.current) {
        lockRef.current.release().catch(() => {});
        lockRef.current = null;
      }
    };
  }, [active]);
}

function AdminView({ products, updateProduct, boxes, updateBox, orders, updateOrderStatus, acknowledgeOrder, leads, promoCodesDb, savePromoCode, deletePromoCode, reviews, approveReview, deleteReview, customProducts, addCustomProduct, updateCustomProduct, deleteCustomProduct, suppliers, addSupplier, deleteSupplier, itemRequests, updateItemRequestStatus }) {
  const [tab, setTab] = useState("catalog");
  const [cat, setCat] = useState(CATALOG[0].cat);
  const [quotingLead, setQuotingLead] = useState(null); // the Office Box lead currently open in the quotation view, or null
  const { unacknowledged, notifPermission, requestNotifPermission, testRing } = useNewOrderAlert(orders);
  useWakeLock(true); // keep the screen awake for as long as Backstage is open, not just while an order is pending

  return (
    <div style={{ paddingTop: 22 }}>
      <SectionTitle eyebrow="Backstage" title="Manage your store" />

      {unacknowledged.length > 0 && (
        <div style={{ background: BRAND.tomato, color: "#fff", borderRadius: 14, padding: "16px 18px", marginBottom: 14, boxShadow: "0 6px 20px rgba(0,0,0,0.18)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>
                🔔 {unacknowledged.length === 1 ? "New order waiting" : `${unacknowledged.length} new orders waiting`}
              </div>
              <div style={{ fontSize: 13, opacity: 0.9, marginTop: 4 }}>
                {unacknowledged[0].id} — {unacknowledged[0].customer?.name || "Customer"} — {money(unacknowledged[0].total)}
                {unacknowledged.length > 1 && ` (+${unacknowledged.length - 1} more)`}
              </div>
            </div>
            <PrimaryButton
              onClick={() => acknowledgeOrder(unacknowledged[0].id)}
              style={{ background: "#fff", color: BRAND.tomato, flexShrink: 0 }}
            >
              ✓ Receive Order
            </PrimaryButton>
          </div>
        </div>
      )}
      <div style={{ background: "#fff", border: `1px solid ${BRAND.creamDeep}`, borderRadius: 12, padding: 12, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12.5 }}>Test the new-order ring right now, on this computer.</span>
        <GhostButton onClick={testRing} style={{ padding: "6px 14px", fontSize: 12.5 }}>🔔 Test ring</GhostButton>
      </div>
      {notifPermission === "default" && (
        <div style={{ background: "#FBF0D9", border: `1px solid ${BRAND.gold}`, borderRadius: 12, padding: 12, fontSize: 12.5, color: BRAND.orangeDeep, marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <span>Turn on desktop notifications to get alerted the instant a new order arrives, even if this tab isn't focused.</span>
          <GhostButton onClick={requestNotifPermission} style={{ padding: "6px 14px", fontSize: 12.5 }}>Enable notifications</GhostButton>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, margin: "16px 0", flexWrap: "wrap" }}>
        <Pill active={tab === "catalog"} onClick={() => setTab("catalog")}><Settings size={13} style={{ marginRight: 4 }} />Prices & availability</Pill>
        <Pill active={tab === "orders"} onClick={() => setTab("orders")}><ClipboardList size={13} style={{ marginRight: 4 }} />Orders ({orders.length})</Pill>
        <Pill active={tab === "leads"} onClick={() => setTab("leads")}><Building2 size={13} style={{ marginRight: 4 }} />Commercial leads ({leads.length})</Pill>
        <Pill active={tab === "reports"} onClick={() => setTab("reports")}><TrendingUp size={13} style={{ marginRight: 4 }} />Sales Report</Pill>
        <Pill active={tab === "promos"} onClick={() => setTab("promos")}><Banknote size={13} style={{ marginRight: 4 }} />Promo Codes ({Object.keys(promoCodesDb).length})</Pill>
        <Pill active={tab === "pricing"} onClick={() => setTab("pricing")}><Calculator size={13} style={{ marginRight: 4 }} />Pricing Calculator</Pill>
        <Pill active={tab === "reviews"} onClick={() => setTab("reviews")}>⭐ Reviews ({(reviews || []).filter((r) => !r.approved).length} pending)</Pill>
        <Pill active={tab === "newproduct"} onClick={() => setTab("newproduct")}>➕ Add New Product</Pill>
        <Pill active={tab === "customers"} onClick={() => setTab("customers")}>📧 Customers</Pill>
        <Pill active={tab === "subscriptions"} onClick={() => setTab("subscriptions")}>🔁 Subscriptions</Pill>
        <Pill active={tab === "itemrequests"} onClick={() => setTab("itemrequests")}>🙋 Item Requests ({(itemRequests || []).filter((r) => r.status === "pending").length} new)</Pill>
      </div>

      {tab === "pricing" && <PricingCalculator products={products} boxes={boxes} updateProduct={updateProduct} updateBox={updateBox} />}
      {tab === "reviews" && <ReviewModeration reviews={reviews || []} approveReview={approveReview} deleteReview={deleteReview} />}
      {tab === "customers" && <CustomerExport orders={orders} reviews={reviews || []} />}
      {tab === "subscriptions" && <SubscriptionsPanel />}
      {tab === "itemrequests" && <ItemRequestsPanel itemRequests={itemRequests || []} updateItemRequestStatus={updateItemRequestStatus} />}
      {tab === "newproduct" && (
        <CustomProductManager
          customProducts={customProducts || []}
          addCustomProduct={addCustomProduct}
          updateCustomProduct={updateCustomProduct}
          deleteCustomProduct={deleteCustomProduct}
        />
      )}

      {tab === "catalog" && (
        <div>
          <LowStockBanner products={products} suppliers={suppliers || []} addSupplier={addSupplier} deleteSupplier={deleteSupplier} />
          <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 16, marginBottom: 10 }}>Boxes (Vegetable, Fruit &amp; Frozen)</div>
          <div style={{ background: "#fff", border: `1px solid ${BRAND.creamDeep}`, borderRadius: 14, overflow: "hidden", marginBottom: 26 }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", padding: "10px 16px", background: BRAND.greenSoft, fontWeight: 700, fontSize: 12.5 }}>
              <div>Box</div><div>Weight</div><div>Price (AED)</div><div>Status</div>
            </div>
            {boxes.map((b) => (
              <BoxRow key={b.id} box={b} updateBox={updateBox} />
            ))}
          </div>

          <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 16, marginBottom: 10 }}>Individual items, by category</div>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12 }}>
            {CATALOG.map((c) => (
              <Pill key={c.cat} active={c.cat === cat} onClick={() => setCat(c.cat)}>{c.cat}</Pill>
            ))}
          </div>
          <div style={{ background: "#fff", border: `1px solid ${BRAND.creamDeep}`, borderRadius: 14, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "auto 2fr 1fr 1fr 1fr 1fr auto", padding: "10px 16px", background: BRAND.greenSoft, fontWeight: 700, fontSize: 12.5, gap: 8 }}>
              <div></div><div>Item</div><div>Unit</div><div>Price (AED)</div><div>Stock</div><div>Available</div><div>Photo</div>
            </div>
            {products.filter((p) => p.category === cat).map((p) => (
              <CatalogRow key={p.id} product={p} updateProduct={updateProduct} />
            ))}
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {CALLMEBOT_READY && <CallMeBotTestButton />}
          {!CALLMEBOT_READY && (
            <div style={{ background: "#FBF0D9", border: `1px solid ${BRAND.gold}`, borderRadius: 12, padding: 12, fontSize: 12.5, color: BRAND.orangeDeep }}>
              WhatsApp alerts for new orders aren't set up yet. Get your free CallMeBot API key (see comment near "CALLMEBOT_APIKEY" in the code) so you get a WhatsApp message the instant an order comes in.
            </div>
          )}
          {!EMAILJS_READY && (
            <div style={{ background: "#FBF0D9", border: `1px solid ${BRAND.gold}`, borderRadius: 12, padding: 12, fontSize: 12.5, color: BRAND.orangeDeep }}>
              Email alerts for new orders aren't set up yet. Add your EmailJS Service ID, Template ID, and Public Key near the top of the code (search for "EMAILJS_SERVICE_ID") to start getting an email the moment an order comes in.
            </div>
          )}
          {EMAILJS_READY && !EMAILJS_STATUS_READY && (
            <div style={{ background: "#FBF0D9", border: `1px solid ${BRAND.gold}`, borderRadius: 12, padding: 12, fontSize: 12.5, color: BRAND.orangeDeep }}>
              Automatic status-update emails to customers aren't set up yet. Create a second template in your EmailJS dashboard (with variables: customer_name, order_id, status_label, track_link) and add its ID as EMAILJS_STATUS_TEMPLATE_ID near the top of the code.
            </div>
          )}
          {!GOOGLE_MAPS_READY && (
            <div style={{ background: "#FBF0D9", border: `1px solid ${BRAND.gold}`, borderRadius: 12, padding: 12, fontSize: 12.5, color: BRAND.orangeDeep }}>
              Checkout is using free OpenStreetMap search for building/address lookup, which has weaker coverage in the UAE. Add your Google Maps API key (search for "GOOGLE_MAPS_API_KEY" in the code) for much better building-name search.
            </div>
          )}
          {orders.length === 0 && <div style={{ opacity: 0.6, fontSize: 14 }}>No orders yet.</div>}
          {orders.map((o) => (
            <OrderRow key={o.id} order={o} updateOrderStatus={updateOrderStatus} acknowledgeOrder={acknowledgeOrder} />
          ))}
        </div>
      )}

      {tab === "leads" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {leads.length === 0 && <div style={{ opacity: 0.6, fontSize: 14 }}>No commercial sign-ups yet.</div>}
          {leads.map((l) => (
            <div key={l.id} style={{ background: "#fff", border: `1px solid ${BRAND.creamDeep}`, borderRadius: 14, padding: 16 }}>
              <div style={{ fontWeight: 800 }}>{l.company} {l.bizType && <span style={{ fontWeight: 600, opacity: 0.6, fontSize: 12 }}>· {l.bizType}</span>}</div>
              <div style={{ fontSize: 12.5, opacity: 0.65 }}>{l.contact} · {l.phone}</div>
              {l.volume && <div style={{ fontSize: 12.5, opacity: 0.65 }}>Est. volume: {l.volume}</div>}
              {l.message && <div style={{ fontSize: 12.5, opacity: 0.65, marginTop: 4 }}>"{l.message}"</div>}
              {l.bizType === "Office Box" && suggestedOfficeBoxWeeklyPrice(l.headcount) && (
                <div style={{ fontSize: 12.5, fontWeight: 700, color: BRAND.green, marginTop: 4 }}>
                  💰 Suggested: {suggestedOfficeBoxWeeklyPrice(l.headcount)}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                <div style={{ fontSize: 11, opacity: 0.45 }}>{new Date(l.createdAt).toLocaleString()}</div>
                {l.bizType === "Office Box" && (
                  <GhostButton style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => setQuotingLead(l)}>
                    📄 Generate quotation
                  </GhostButton>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {quotingLead && <QuotationView lead={quotingLead} onClose={() => setQuotingLead(null)} />}

      {tab === "reports" && <SalesReportPanel orders={orders} />}
      {tab === "promos" && <PromoCodesPanel promoCodesDb={promoCodesDb} savePromoCode={savePromoCode} deletePromoCode={deletePromoCode} />}
    </div>
  );
}

function PromoCodesPanel({ promoCodesDb, savePromoCode, deletePromoCode }) {
  const [code, setCode] = useState("");
  const [type, setType] = useState("percent");
  const [value, setValue] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");

  function handleAdd() {
    const clean = code.trim().toUpperCase();
    if (!clean || !/^[A-Z0-9]{3,12}$/.test(clean)) {
      setError("Code must be 3–12 letters/numbers, no spaces or symbols.");
      return;
    }
    const numValue = parseFloat(value);
    if (!numValue || numValue <= 0) {
      setError("Enter a discount value greater than 0.");
      return;
    }
    savePromoCode(clean, { type, value: numValue, label: label.trim() || `${type === "percent" ? numValue + "%" : "AED " + numValue} off` });
    setCode("");
    setValue("");
    setLabel("");
    setError("");
  }

  return (
    <div>
      <div style={{ background: "#fff", border: `1px solid ${BRAND.creamDeep}`, borderRadius: 14, padding: 18, marginBottom: 20 }}>
        <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 16, marginBottom: 12 }}>Create a new code</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))", gap: 10 }}>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="CODE (e.g. SUMMER15)" style={inputStyle} />
          <select value={type} onChange={(e) => setType(e.target.value)} style={inputStyle}>
            <option value="percent">% off subtotal</option>
            <option value="fixed">AED off subtotal</option>
          </select>
          <input value={value} onChange={(e) => setValue(e.target.value)} placeholder={type === "percent" ? "e.g. 15" : "e.g. 25"} type="number" style={inputStyle} />
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label shown to customer (optional)" style={inputStyle} />
        </div>
        {error && <div style={{ fontSize: 12.5, color: BRAND.tomato, marginTop: 8 }}>{error}</div>}
        <PrimaryButton onClick={handleAdd} style={{ marginTop: 12 }}>Add code</PrimaryButton>
      </div>

      <div style={{ background: "#fff", border: `1px solid ${BRAND.creamDeep}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 2fr 0.6fr", padding: "10px 16px", background: BRAND.greenSoft, fontWeight: 700, fontSize: 12.5 }}>
          <div>Code</div><div>Discount</div><div>Label</div><div></div>
        </div>
        {Object.keys(promoCodesDb).length === 0 && (
          <div style={{ padding: 16, fontSize: 13, opacity: 0.6 }}>No active promo codes.</div>
        )}
        {Object.entries(promoCodesDb).map(([c, data]) => (
          <div key={c} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 2fr 0.6fr", padding: "10px 16px", borderTop: `1px solid ${BRAND.creamDeep}`, alignItems: "center", fontSize: 13 }}>
            <div style={{ fontFamily: "IBM Plex Mono, monospace", fontWeight: 700 }}>{c}</div>
            <div>{data.type === "percent" ? `${data.value}%` : `AED ${data.value}`}</div>
            <div style={{ opacity: 0.7 }}>{data.label}</div>
            <button onClick={() => deletePromoCode(c)} style={{ background: "none", border: "none", color: BRAND.tomato, cursor: "pointer" }} aria-label="Delete">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 11.5, opacity: 0.55, marginTop: 10 }}>
        Changes here apply instantly across the site — no redeploy needed. Referral codes (auto-generated per customer) work separately and don't need to be added here.
      </p>
    </div>
  );
}

function SalesReportPanel({ orders }) {
  const now = new Date();
  const [range, setRange] = useState("7days"); // "today" | "7days" | "30days" | "month" | "all" | "custom"
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  function sameDay(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  }
  function daysAgo(n) {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  const withDates = orders.map((o) => ({ ...o, _date: new Date(o.createdAt) }));

  // The filtered set the whole report (stats, table, export) is built from —
  // switching the range control changes everything below it at once.
  const filtered = withDates.filter((o) => {
    if (range === "today") return sameDay(o._date, now);
    if (range === "7days") return o._date >= daysAgo(6);
    if (range === "30days") return o._date >= daysAgo(29);
    if (range === "month") return o._date.getFullYear() === now.getFullYear() && o._date.getMonth() === now.getMonth();
    if (range === "custom") {
      if (!customStart && !customEnd) return true;
      const afterStart = !customStart || o._date >= new Date(customStart + "T00:00:00");
      const beforeEnd = !customEnd || o._date <= new Date(customEnd + "T23:59:59");
      return afterStart && beforeEnd;
    }
    return true; // "all"
  });

  function summarize(list) {
    const total = list.reduce((s, o) => s + (o.total || 0), 0);
    const count = list.length;
    const avg = count ? total / count : 0;
    const discount = list.reduce((s, o) => s + (o.discount || 0), 0);
    const pointsRedeemed = list.reduce((s, o) => s + (o.pointsRedeemed || 0), 0);
    const deliveryFees = list.reduce((s, o) => s + (o.deliveryFee || 0), 0);
    const vat = list.reduce((s, o) => s + (o.vat || 0), 0);
    return { total, count, avg, discount, pointsRedeemed, deliveryFees, vat };
  }
  const summary = summarize(filtered);

  // Cash vs card — the actual thing that matters for reconciling what's
  // physically in hand against what the system says was collected.
  const cashOrders = filtered.filter((o) => o.customer?.payment === "cod");
  const cardOrders = filtered.filter((o) => o.customer?.payment !== "cod");
  const dCash = summarize(cashOrders);
  const dCard = summarize(cardOrders);

  // Most-ordered items, within the selected range
  const itemMap = {};
  filtered.forEach((o) => {
    (o.items || []).forEach((it) => {
      if (!itemMap[it.name]) itemMap[it.name] = { name: it.name, qty: 0, revenue: 0 };
      itemMap[it.name].qty += it.qty;
      itemMap[it.name].revenue += it.qty * it.price;
    });
  });
  const topItems = Object.values(itemMap).sort((a, b) => b.qty - a.qty).slice(0, 10);

  // Revenue by delivery area — useful for spotting where demand actually is
  const areaMap = {};
  filtered.forEach((o) => {
    const area = o.customer?.area || "Unknown";
    if (!areaMap[area]) areaMap[area] = { area, count: 0, revenue: 0 };
    areaMap[area].count += 1;
    areaMap[area].revenue += o.total || 0;
  });
  const topAreas = Object.values(areaMap).sort((a, b) => b.revenue - a.revenue).slice(0, 8);

  // Last 7 days, day-by-day, for a simple bar chart — always the trailing
  // week regardless of the range filter, so there's always a trend to see
  const dayBars = Array.from({ length: 7 }, (_, i) => {
    const dayStart = daysAgo(6 - i);
    const dayTotal = withDates.filter((o) => sameDay(o._date, dayStart)).reduce((s, o) => s + (o.total || 0), 0);
    return { label: dayStart.toLocaleDateString(undefined, { weekday: "short" }), total: dayTotal };
  });
  const maxBar = Math.max(1, ...dayBars.map((d) => d.total));

  function downloadCsv() {
    const header = ["Date", "Order ID", "Customer", "Phone", "Area", "Payment", "Status", "Items", "Subtotal", "Discount", "Points Used", "Delivery Fee", "VAT", "Total"];
    const rows = filtered
      .slice()
      .sort((a, b) => b._date - a._date)
      .map((o) => [
        o._date.toLocaleString(),
        o.id,
        o.customer?.name || "",
        o.customer?.phone || "",
        o.customer?.area || "",
        o.customer?.payment === "cod" ? "Cash" : "Card",
        o.status || "",
        (o.items || []).length,
        (o.subtotal || 0).toFixed(2),
        (o.discount || 0).toFixed(2),
        o.pointsRedeemed || 0,
        (o.deliveryFee || 0).toFixed(2),
        (o.vat || 0).toFixed(2),
        (o.total || 0).toFixed(2),
      ]);
    const lines = [header, ...rows];
    const csv = lines.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `darousha-fresh-sales-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function StatCard({ label, stat, accent }) {
    return (
      <div style={{ background: "#fff", border: `1px solid ${BRAND.creamDeep}`, borderRadius: 14, padding: 18, flex: 1, minWidth: 160 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
        <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 800, fontSize: 26, color: accent || BRAND.green, marginTop: 6 }}>{money(stat.total)}</div>
        <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>{stat.count} order{stat.count === 1 ? "" : "s"} · avg {money(stat.avg)}</div>
      </div>
    );
  }

  const rangeLabel = { today: "Today", "7days": "Last 7 Days", "30days": "Last 30 Days", month: "This Month", all: "All Time", custom: "Custom Range" }[range];

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18, alignItems: "center" }}>
        {["today", "7days", "30days", "month", "all", "custom"].map((r) => (
          <Pill key={r} active={range === r} onClick={() => setRange(r)}>
            {{ today: "Today", "7days": "7 Days", "30days": "30 Days", month: "This Month", all: "All Time", custom: "Custom" }[r]}
          </Pill>
        ))}
        {range === "custom" && (
          <>
            <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} style={{ ...inputStyle, padding: "6px 8px", fontSize: 12.5 }} />
            <span style={{ fontSize: 12, opacity: 0.5 }}>to</span>
            <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} style={{ ...inputStyle, padding: "6px 8px", fontSize: 12.5 }} />
          </>
        )}
        <div style={{ marginInlineStart: "auto" }}>
          <PrimaryButton onClick={downloadCsv} disabled={filtered.length === 0}>⬇ Download Report (Excel/CSV)</PrimaryButton>
        </div>
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 18 }}>
        <StatCard label={rangeLabel} stat={summary} />
        <StatCard label="💵 Cash Orders" stat={dCash} accent={BRAND.orangeDeep} />
        <StatCard label="💳 Card Orders" stat={dCard} accent={BRAND.green} />
      </div>

      <div style={{ background: "#fff", border: `1px solid ${BRAND.creamDeep}`, borderRadius: 14, padding: 18, marginBottom: 18, display: "flex", gap: 24, flexWrap: "wrap", fontSize: 13 }}>
        <div><span style={{ opacity: 0.6 }}>Discounts given:</span> <b>{money(summary.discount)}</b></div>
        <div><span style={{ opacity: 0.6 }}>Loyalty points redeemed:</span> <b>{summary.pointsRedeemed} pts</b></div>
        <div><span style={{ opacity: 0.6 }}>Delivery fees collected:</span> <b>{money(summary.deliveryFees)}</b></div>
        <div><span style={{ opacity: 0.6 }}>VAT collected:</span> <b>{money(summary.vat)}</b></div>
      </div>

      <div style={{ background: "#fff", border: `1px solid ${BRAND.creamDeep}`, borderRadius: 14, padding: 18, marginBottom: 18 }}>
        <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Last 7 days</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 100 }}>
          {dayBars.map((d, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{ width: "100%", height: Math.max(4, (d.total / maxBar) * 76), background: BRAND.green, borderRadius: 4 }} title={money(d.total)} />
              <div style={{ fontSize: 10, opacity: 0.6, fontWeight: 700 }}>{d.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }} className="dsf-about-grid">
        <div style={{ background: "#fff", border: `1px solid ${BRAND.creamDeep}`, borderRadius: 14, padding: 18 }}>
          <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Top items ({rangeLabel})</div>
          {topItems.length === 0 && <div style={{ opacity: 0.6, fontSize: 13 }}>No orders in this range.</div>}
          {topItems.map((it, i) => (
            <div key={it.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: i < topItems.length - 1 ? `1px solid ${BRAND.creamDeep}` : "none" }}>
              <div style={{ width: 20, fontWeight: 800, opacity: 0.4, fontSize: 12 }}>{i + 1}</div>
              <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{it.name}</div>
              <div style={{ fontSize: 12.5, opacity: 0.65 }}>×{it.qty}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.green, minWidth: 80, textAlign: "right" }}>{money(it.revenue)}</div>
            </div>
          ))}
        </div>

        <div style={{ background: "#fff", border: `1px solid ${BRAND.creamDeep}`, borderRadius: 14, padding: 18 }}>
          <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 15, marginBottom: 12 }}>Top delivery areas ({rangeLabel})</div>
          {topAreas.length === 0 && <div style={{ opacity: 0.6, fontSize: 13 }}>No orders in this range.</div>}
          {topAreas.map((a, i) => (
            <div key={a.area} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: i < topAreas.length - 1 ? `1px solid ${BRAND.creamDeep}` : "none" }}>
              <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{a.area}</div>
              <div style={{ fontSize: 12.5, opacity: 0.65 }}>{a.count} order{a.count === 1 ? "" : "s"}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.green, minWidth: 80, textAlign: "right" }}>{money(a.revenue)}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "#fff", border: `1px solid ${BRAND.creamDeep}`, borderRadius: 14, padding: 18 }}>
        <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 15, marginBottom: 12 }}>
          Orders in this range ({filtered.length})
        </div>
        {filtered.length === 0 ? (
          <div style={{ opacity: 0.6, fontSize: 13 }}>No orders in this range.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: `2px solid ${BRAND.creamDeep}` }}>
                  <th style={{ padding: "8px 10px" }}>Date</th>
                  <th style={{ padding: "8px 10px" }}>Order</th>
                  <th style={{ padding: "8px 10px" }}>Customer</th>
                  <th style={{ padding: "8px 10px" }}>Payment</th>
                  <th style={{ padding: "8px 10px" }}>Status</th>
                  <th style={{ padding: "8px 10px", textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice().sort((a, b) => b._date - a._date).slice(0, 100).map((o) => (
                  <tr key={o.id} style={{ borderBottom: `1px solid ${BRAND.creamDeep}` }}>
                    <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>{o._date.toLocaleDateString()}</td>
                    <td style={{ padding: "8px 10px", fontFamily: "IBM Plex Mono, monospace" }}>{o.id}</td>
                    <td style={{ padding: "8px 10px" }}>{o.customer?.name}</td>
                    <td style={{ padding: "8px 10px" }}>{o.customer?.payment === "cod" ? "💵 Cash" : "💳 Card"}</td>
                    <td style={{ padding: "8px 10px" }}>{(STATUS_STEPS.find((s) => s.key === o.status) || {}).label || o.status}</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700 }}>{money(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length > 100 && (
              <div style={{ fontSize: 11.5, opacity: 0.5, marginTop: 10 }}>Showing the most recent 100 of {filtered.length} — download the CSV for the full list.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function OrderRow({ order: o, updateOrderStatus, acknowledgeOrder }) {
  const [saveState, setSaveState] = useState(null); // null | "saving" | "saved" | "failed"

  async function handleStatusChange(newStatus) {
    setSaveState("saving");
    const ok = await updateOrderStatus(o.id, newStatus);
    setSaveState(ok ? "saved" : "failed");
    if (ok) setTimeout(() => setSaveState(null), 2000);
    if (ok) {
      // The email (if configured) sends fully automatically — no popup
      // involved, so it isn't affected by a browser's popup blocker.
      sendOrderStatusEmail(o, newStatus); // fire-and-forget; safe no-op until EMAILJS_STATUS_TEMPLATE_ID is set
    }
  }

  return (
    <div style={{ background: "#fff", border: `1.5px solid ${o.acknowledgedAt ? BRAND.creamDeep : BRAND.tomato}`, borderRadius: 14, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontFamily: "IBM Plex Mono, monospace", fontWeight: 700 }}>{o.id}</div>
            {!o.acknowledgedAt && (
              <span style={{ background: BRAND.tomato, color: "#fff", fontSize: 10.5, fontWeight: 800, borderRadius: 999, padding: "2px 9px" }}>
                NEW
              </span>
            )}
          </div>
          <div style={{ fontSize: 12.5, opacity: 0.65 }}>{o.customer.name} · {o.customer.phone}</div>
          <div style={{ fontSize: 12.5, opacity: 0.65 }}>
            {o.customer.address}, {o.customer.area}
            {o.customer.lat && o.customer.lng && (
              <span style={{ color: BRAND.green, fontWeight: 700, marginLeft: 6 }}>· 📍 GPS shared</span>
            )}
          </div>
          <div style={{ fontSize: 12.5, opacity: 0.65 }}>{o.customer.date} · {o.customer.slot} · {o.customer.payment === "cod" ? "Cash on delivery" : "Card"}</div>
          {o.customer.leaveAtDoor && (
            <div style={{ fontSize: 12.5, color: BRAND.orangeDeep, fontWeight: 700, marginTop: 2 }}>📍 Leave at door — no need to knock</div>
          )}
          {o.customer.isGift && (
            <div style={{ fontSize: 12.5, color: BRAND.orangeDeep, fontWeight: 700, marginTop: 4, background: "#FBF0D9", borderRadius: 8, padding: "6px 10px" }}>
              🎁 GIFT ORDER
              {o.customer.giftRecipientName && <div>For: {o.customer.giftRecipientName}</div>}
              {o.customer.giftNote && <div style={{ fontStyle: "italic", marginTop: 2 }}>"{o.customer.giftNote}"</div>}
            </div>
          )}
          {o.customer.subscribeWeekly && (
            <div style={{ fontSize: 12.5, color: BRAND.green, fontWeight: 700, marginTop: 2 }}>🔁 Wants weekly recurring delivery — follow up to set up</div>
          )}
          {o.referralCodeUsed && (
            <div style={{ fontSize: 12.5, color: BRAND.orangeDeep, fontWeight: 700, marginTop: 2 }}>🎁 Used referral code {o.referralCodeUsed} — reward the referring customer</div>
          )}
          <a
            href={buildDirectionsLink(o)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8, marginRight: 8,
              background: BRAND.gold, color: "#fff", fontWeight: 700, fontSize: 12.5,
              padding: "7px 12px", borderRadius: 8, textDecoration: "none",
            }}
          >
            <MapPin size={13} /> Get Directions
          </a>
          <a
            href={buildDriveLink(o.id)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8,
              background: BRAND.green, color: "#fff", fontWeight: 700, fontSize: 12.5,
              padding: "7px 12px", borderRadius: 8, textDecoration: "none",
            }}
          >
            <Truck size={13} /> Delivery Mode
          </a>
          <a
            href={buildInvoiceLink(o.id)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8, marginLeft: 8,
              background: BRAND.orangeDeep, color: "#fff", fontWeight: 700, fontSize: 12.5,
              padding: "7px 12px", borderRadius: 8, textDecoration: "none",
            }}
          >
            🧾 Invoice
          </a>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 800 }}>{money(o.total)}</div>
          {!o.acknowledgedAt && (
            <button
              onClick={() => acknowledgeOrder(o.id)}
              style={{
                display: "block", width: 180, marginTop: 8, marginBottom: 8, marginLeft: "auto",
                background: BRAND.tomato, color: "#fff", border: "none", borderRadius: 8,
                padding: "8px 12px", fontWeight: 800, fontSize: 12.5, cursor: "pointer",
              }}
            >
              ✓ Receive Order
            </button>
          )}
          <select value={o.status} onChange={(e) => handleStatusChange(e.target.value)} style={{ ...inputStyle, marginTop: 8, width: 180 }}>
            {STATUS_STEPS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <div style={{ fontSize: 11, marginTop: 4, height: 14 }}>
            {saveState === "saving" && <span style={{ opacity: 0.6 }}>Saving…</span>}
            {saveState === "saved" && <span style={{ color: BRAND.green, fontWeight: 700 }}>✓ Saved</span>}
            {saveState === "failed" && <span style={{ color: BRAND.tomato, fontWeight: 700 }}>Failed to save — try again</span>}
          </div>
          <a
            href={buildWhatsAppLink(o)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, marginTop: 4,
              background: BRAND.green, color: "#fff", fontWeight: 700, fontSize: 12.5,
              padding: "8px 12px", borderRadius: 8, textDecoration: "none", width: 180, justifyContent: "center",
            }}
          >
            <Phone size={13} /> Send to dispatch
          </a>
          <a
            href={buildStatusNotifyLink(o, o.status)}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8,
              background: "#25D366", color: "#fff", fontWeight: 700, fontSize: 12.5,
              padding: "8px 12px", borderRadius: 8, textDecoration: "none", width: 180, justifyContent: "center",
            }}
          >
            <Phone size={13} /> Notify customer ({STATUS_STEPS.find((s) => s.key === o.status)?.label || o.status})
          </a>
          <a
            href={buildMailtoLink(o)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8,
              background: BRAND.orange, color: "#fff", fontWeight: 700, fontSize: 12.5,
              padding: "8px 12px", borderRadius: 8, textDecoration: "none", width: 180, justifyContent: "center",
            }}
          >
            <Phone size={13} /> Email this order
          </a>
        </div>
      </div>
      <div style={{ fontSize: 11, opacity: 0.5, marginTop: 8 }}>
        "Send to dispatch" sends this order to {formatPhoneDisplay(WHATSAPP_NUMBER)} on WhatsApp. "Email this order" opens your mail app addressed to {BUSINESS_EMAIL}. "Notify customer" always matches whatever this order's current status is above — tap it any time to send that update over WhatsApp (a customer-facing status email also goes out automatically the moment you change the status, no tap needed).
      </div>
    </div>
  );
}

function BoxRow({ box, updateBox }) {
  const [price, setPrice] = useState(box.price);
  const [pieces, setPieces] = useState(box.pieceCount || "");
  const [discountOpen, setDiscountOpen] = useState(false);
  const [salePrice, setSalePrice] = useState(box.salePrice == null ? "" : box.salePrice);
  const [justSaved, setJustSaved] = useState(null); // null | "price" | "pieces" | "price-failed" | "pieces-failed"
  const hasDiscount = typeof box.salePrice === "number" && box.salePrice > 0 && box.salePrice < box.price;

  async function commitPieces(e) {
    const n = Math.max(1, Number(pieces) || box.pieceCount);
    setPieces(n);
    if (e) e.target.blur();
    const ok = await updateBox(box.id, { pieceCount: n, weight: `${n} pieces` });
    setJustSaved(ok ? "pieces" : "pieces-failed");
    setTimeout(() => setJustSaved(null), ok ? 1500 : 5000);
  }

  async function commitPrice(e) {
    if (e) e.target.blur();
    const ok = await updateBox(box.id, { price: Number(price) || 0 });
    setJustSaved(ok ? "price" : "price-failed");
    setTimeout(() => setJustSaved(null), ok ? 1500 : 5000);
  }

  async function commitSalePrice() {
    const n = salePrice === "" ? null : Math.max(0, Number(salePrice) || 0);
    if (n !== null && n >= box.price) {
      window.alert("Sale price must be lower than the regular price to show as a discount.");
      return;
    }
    const ok = await updateBox(box.id, { salePrice: n });
    setJustSaved(ok ? "salePrice" : "salePrice-failed");
    setTimeout(() => setJustSaved(null), ok ? 1500 : 5000);
  }

  return (
    <div style={{ borderTop: `1px solid ${BRAND.creamDeep}` }}>
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", padding: "10px 16px", alignItems: "center", fontSize: 13.5 }}>
      <div>{box.name}</div>
      {box.customizable ? (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <input
            type="number"
            value={pieces}
            onChange={(e) => setPieces(e.target.value)}
            onBlur={commitPieces}
            onKeyDown={(e) => e.key === "Enter" && commitPieces(e)}
            style={{ ...inputStyle, padding: "6px 8px", width: 55 }}
          />
          <span style={{ opacity: 0.65, fontSize: 12 }}>pieces</span>
          {justSaved === "pieces" && <span style={{ color: BRAND.green, fontSize: 11, fontWeight: 700 }}>✓ Saved</span>}
          {justSaved === "pieces-failed" && <span style={{ color: BRAND.tomato, fontSize: 11, fontWeight: 700 }}>⚠ Failed to save — try again</span>}
        </div>
      ) : (
        <div style={{ opacity: 0.65 }}>{box.weight}</div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          onBlur={commitPrice}
          onKeyDown={(e) => e.key === "Enter" && commitPrice(e)}
          style={{ ...inputStyle, padding: "6px 8px", width: 70 }}
        />
        {justSaved === "price" && <span style={{ color: BRAND.green, fontSize: 11, fontWeight: 700 }}>✓ Saved</span>}
        {justSaved === "price-failed" && <span style={{ color: BRAND.tomato, fontSize: 11, fontWeight: 700 }}>⚠ Failed — try again</span>}
        <button
          onClick={() => setDiscountOpen((o) => !o)}
          title={hasDiscount ? `On sale: ${money(box.salePrice)}` : "Add a discount price"}
          style={{
            border: `1px solid ${hasDiscount ? BRAND.tomato : BRAND.creamDeep}`, borderRadius: 8, padding: "5px 7px", cursor: "pointer",
            background: hasDiscount ? "#FDEAEA" : "#fff", color: hasDiscount ? BRAND.tomato : BRAND.ink, fontSize: 12, flexShrink: 0,
          }}
        >
          🏷️
        </button>
      </div>
      <div>
        <button
          onClick={() => updateBox(box.id, { available: !box.available })}
          style={{
            border: "none", borderRadius: 999, padding: "6px 12px", cursor: "pointer", fontWeight: 700, fontSize: 12,
            background: box.available ? BRAND.greenSoft : "#F2D9CE",
            color: box.available ? BRAND.green : BRAND.tomato,
          }}
        >
          {box.available ? "Available" : "Hidden"}
        </button>
      </div>
    </div>
    {discountOpen && (
      <div style={{ padding: "0 16px 12px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, opacity: 0.7 }}>Sale price (AED):</span>
        <input
          type="number"
          value={salePrice}
          onChange={(e) => setSalePrice(e.target.value)}
          onBlur={commitSalePrice}
          onKeyDown={(e) => e.key === "Enter" && commitSalePrice()}
          placeholder="e.g. 45"
          style={{ ...inputStyle, padding: "6px 8px", width: 90 }}
        />
        {salePrice !== "" && (
          <button
            onClick={() => { setSalePrice(""); updateBox(box.id, { salePrice: null }); }}
            style={{ background: "none", border: "none", color: BRAND.tomato, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
          >
            Clear
          </button>
        )}
        {justSaved === "salePrice" && <span style={{ color: BRAND.green, fontSize: 11, fontWeight: 700 }}>✓ Saved</span>}
        {justSaved === "salePrice-failed" && <span style={{ color: BRAND.tomato, fontSize: 11, fontWeight: 700 }}>⚠ Failed to save — try again</span>}
      </div>
    )}
    </div>
  );
}

function PricingCalculator({ products, boxes, updateProduct, updateBox }) {
  const [productCost, setProductCost] = useState("");
  const [packaging, setPackaging] = useState("");
  const [delivery, setDelivery] = useState("");
  const [labor, setLabor] = useState("");
  const [overhead, setOverhead] = useState("");
  const [mode, setMode] = useState("margin"); // "margin" | "markup"
  const [percent, setPercent] = useState("35");
  const [applyTarget, setApplyTarget] = useState(""); // "" | "product:<id>" | "box:<id>"
  const [applyMsg, setApplyMsg] = useState("");

  const totalCost = ["productCost", "packaging", "delivery", "labor", "overhead"]
    .reduce((s, k) => s + (Number({ productCost, packaging, delivery, labor, overhead }[k]) || 0), 0);
  const pct = Math.min(99, Math.max(0, Number(percent) || 0));
  const suggestedPrice = totalCost <= 0
    ? 0
    : mode === "margin"
      ? totalCost / (1 - pct / 100)
      : totalCost * (1 + pct / 100);
  const profit = suggestedPrice - totalCost;
  const actualMargin = suggestedPrice > 0 ? (profit / suggestedPrice) * 100 : 0;
  const actualMarkup = totalCost > 0 ? (profit / totalCost) * 100 : 0;

  const allTargets = [
    ...products.map((p) => ({ key: `product:${p.id}`, label: `🛒 ${p.name}`, price: p.price, unit: p.unit, apply: () => updateProduct(p.id, { price: Math.round(suggestedPrice * 100) / 100 }) })),
    ...boxes.map((b) => ({ key: `box:${b.id}`, label: `📦 ${b.name}`, price: b.price, unit: null, apply: () => updateBox(b.id, { price: Math.round(suggestedPrice * 100) / 100 }) })),
  ];
  const selectedTarget = allTargets.find((t) => t.key === applyTarget);

  async function handleApply() {
    if (!selectedTarget || suggestedPrice <= 0) return;
    setApplyMsg("Saving…");
    const ok = await selectedTarget.apply();
    setApplyMsg(ok
      ? `✓ Updated ${selectedTarget.label.replace(/^[^\s]+\s/, "")} to ${money(Math.round(suggestedPrice * 100) / 100)}${selectedTarget.unit ? ` / ${selectedTarget.unit}` : ""}`
      : "⚠ Failed to save — try again");
    setTimeout(() => setApplyMsg(""), ok ? 4000 : 6000);
  }

  const fieldStyle = { ...inputStyle, padding: "8px 10px", width: "100%" };

  return (
    <div>
      <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Pricing Calculator</div>
      <p style={{ fontSize: 12.5, opacity: 0.65, marginBottom: 18, maxWidth: 560 }}>
        Add up every real cost behind an order, pick a margin or markup, and see what to actually charge. Margin and markup give different numbers for the same target profit — this calculator always shows both so you know exactly what you're getting.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }} className="dsf-about-grid">
        <div style={{ background: "#fff", border: `1px solid ${BRAND.creamDeep}`, borderRadius: 14, padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Costs (AED)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              ["Product cost — per kg, per piece, etc., matching however you'll sell it", productCost, setProductCost],
              ["Packaging (box, bags, ice packs, slip)", packaging, setPackaging],
              ["Delivery (fuel/courier fee for this order)", delivery, setDelivery],
              ["Labor (your time to pick & pack, at a real hourly rate)", labor, setLabor],
              ["Overhead per order (rent, app costs, admin — monthly total ÷ orders/month)", overhead, setOverhead],
            ].map(([label, value, setter]) => (
              <label key={label} style={{ fontSize: 12, display: "block" }}>
                {label}
                <input type="number" min="0" value={value} onChange={(e) => setter(e.target.value)} placeholder="0" style={{ ...fieldStyle, marginTop: 4 }} />
              </label>
            ))}
          </div>
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${BRAND.creamDeep}`, display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
            <span>Total cost</span>
            <span style={{ fontFamily: "IBM Plex Mono, monospace" }}>{money(totalCost)}</span>
          </div>
        </div>

        <div style={{ background: "#fff", border: `1px solid ${BRAND.creamDeep}`, borderRadius: 14, padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Target profit</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <Pill active={mode === "margin"} onClick={() => setMode("margin")}>Margin %</Pill>
            <Pill active={mode === "markup"} onClick={() => setMode("markup")}>Markup %</Pill>
          </div>
          <label style={{ fontSize: 12, display: "block", marginBottom: 14 }}>
            {mode === "margin" ? "Target margin — % of the final price that's profit" : "Target markup — % added on top of cost"}
            <input type="number" min="0" max="99" value={percent} onChange={(e) => setPercent(e.target.value)} style={{ ...fieldStyle, marginTop: 4 }} />
          </label>

          <div style={{ background: BRAND.greenSoft, borderRadius: 10, padding: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 11, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>Suggested price</div>
            <div style={{ fontFamily: "IBM Plex Mono, monospace", fontWeight: 800, fontSize: 26, color: BRAND.green }}>{money(suggestedPrice)}</div>
          </div>

          <div style={{ fontSize: 12.5, display: "flex", flexDirection: "column", gap: 4, opacity: 0.85 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Profit per order</span><span style={{ fontWeight: 700 }}>{money(profit)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Actual margin</span><span style={{ fontWeight: 700 }}>{actualMargin.toFixed(1)}%</span></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span>Actual markup</span><span style={{ fontWeight: 700 }}>{actualMarkup.toFixed(1)}%</span></div>
          </div>

          <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${BRAND.creamDeep}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Apply this price to an item</div>
            <select value={applyTarget} onChange={(e) => setApplyTarget(e.target.value)} style={{ ...fieldStyle, marginBottom: 8 }}>
              <option value="">Choose an item…</option>
              {allTargets.map((t) => (
                <option key={t.key} value={t.key}>{t.label} — currently {money(t.price)}{t.unit ? ` / ${t.unit}` : ""}</option>
              ))}
            </select>
            {selectedTarget && (
              <div style={{ fontSize: 11.5, color: BRAND.orangeDeep, marginBottom: 8, lineHeight: 1.4 }}>
                {selectedTarget.unit
                  ? `Make sure the costs above are entered per ${selectedTarget.unit} — this will set the price per ${selectedTarget.unit}, not per piece or any other unit.`
                  : "This box has one fixed price regardless of weight — make sure the costs above are the total for the whole box, not per kg or per piece."}
              </div>
            )}
            <GhostButton onClick={handleApply} style={{ width: "100%", justifyContent: "center", opacity: !applyTarget || suggestedPrice <= 0 ? 0.5 : 1 }}>
              Set price to {money(suggestedPrice)}{selectedTarget?.unit ? ` / ${selectedTarget.unit}` : ""}
            </GhostButton>
            {applyMsg && <div style={{ fontSize: 12, color: applyMsg.startsWith("⚠") ? BRAND.tomato : BRAND.green, fontWeight: 700, marginTop: 6 }}>{applyMsg}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewModeration({ reviews, approveReview, deleteReview }) {
  const pending = reviews.filter((r) => !r.approved);
  const approved = reviews.filter((r) => r.approved);

  function ReviewCard({ r }) {
    return (
      <div style={{ background: "#fff", border: `1px solid ${BRAND.creamDeep}`, borderRadius: 14, padding: 14, display: "flex", gap: 14 }}>
        {r.photoUrl && <img src={r.photoUrl} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 10, flexShrink: 0 }} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: BRAND.gold, fontSize: 14 }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
          {r.text && <div style={{ fontSize: 13, marginTop: 4 }}>"{r.text}"</div>}
          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>— {r.customerName} · Order {r.orderId}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            {!r.approved && (
              <button onClick={() => approveReview(r.id, true)} style={{ background: BRAND.green, color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                ✓ Approve
              </button>
            )}
            {r.approved && (
              <button onClick={() => approveReview(r.id, false)} style={{ background: "#fff", color: BRAND.orangeDeep, border: `1px solid ${BRAND.orangeDeep}`, borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                Unpublish
              </button>
            )}
            <button onClick={() => window.confirm("Delete this review permanently?") && deleteReview(r.id)} style={{ background: "none", color: BRAND.tomato, border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Pending approval ({pending.length})</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        {pending.length === 0 && <div style={{ opacity: 0.5, fontSize: 13 }}>Nothing waiting for review right now.</div>}
        {pending.map((r) => <ReviewCard key={r.id} r={r} />)}
      </div>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Published on the site ({approved.length})</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {approved.map((r) => <ReviewCard key={r.id} r={r} />)}
      </div>
    </div>
  );
}

const ITEM_REQUEST_STATUSES = ["pending", "sourcing", "added", "declined"];
const ITEM_REQUEST_STATUS_LABEL = { pending: "New", sourcing: "Sourcing", added: "Added ✓", declined: "Declined" };
const ITEM_REQUEST_STATUS_COLOR = { pending: "#C6A24C", sourcing: "#2F6DB3", added: "#2E7D32", declined: "#B23B3B" };

function ItemRequestsPanel({ itemRequests, updateItemRequestStatus }) {
  // Group by normalized item name so repeat asks for the same thing are
  // obvious at a glance — the strongest signal for what to add next.
  const grouped = useMemo(() => {
    const map = new Map();
    itemRequests.forEach((r) => {
      const key = (r.itemName || "").trim().toLowerCase();
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(r);
    });
    return [...map.entries()]
      .map(([key, reqs]) => ({ key, name: reqs[0].itemName, requests: reqs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) }))
      .sort((a, b) => b.requests.length - a.requests.length);
  }, [itemRequests]);

  if (itemRequests.length === 0) {
    return <div style={{ opacity: 0.5, fontSize: 13 }}>No item requests yet. When a customer can't find something, it'll show up here.</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {grouped.map((g) => (
        <div key={g.key} style={{ background: "#fff", border: `1px solid ${BRAND.creamDeep}`, borderRadius: 14, padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>
              {g.name} {g.requests.length > 1 && <span style={{ fontWeight: 700, fontSize: 12, color: BRAND.orangeDeep }}>× {g.requests.length} requests</span>}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
            {g.requests.map((r) => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", borderTop: `1px solid ${BRAND.creamDeep}`, paddingTop: 8 }}>
                <div style={{ fontSize: 12.5, minWidth: 0 }}>
                  {r.quantity && <span style={{ opacity: 0.7 }}>Qty: {r.quantity} · </span>}
                  {r.customerName && <span style={{ opacity: 0.7 }}>{r.customerName} · </span>}
                  {r.customerPhone && (
                    <a href={`https://wa.me/${r.customerPhone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" style={{ color: BRAND.green, fontWeight: 700 }}>
                      {r.customerPhone}
                    </a>
                  )}
                  {r.note && <div style={{ opacity: 0.6, marginTop: 2 }}>"{r.note}"</div>}
                  <div style={{ opacity: 0.45, marginTop: 2 }}>{new Date(r.createdAt).toLocaleString()}</div>
                </div>
                <select
                  value={r.status || "pending"}
                  onChange={(e) => updateItemRequestStatus(r.id, e.target.value)}
                  style={{ border: `1px solid ${ITEM_REQUEST_STATUS_COLOR[r.status || "pending"]}`, color: ITEM_REQUEST_STATUS_COLOR[r.status || "pending"], borderRadius: 8, padding: "5px 8px", fontSize: 12, fontWeight: 700, background: "#fff" }}
                >
                  {ITEM_REQUEST_STATUSES.map((s) => (
                    <option key={s} value={s}>{ITEM_REQUEST_STATUS_LABEL[s]}</option>
                  ))}
                </select>
                {r.status === "added" && r.customerPhone && (
                  <a
                    href={buildItemRequestNotifyLink(r)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ background: BRAND.green, color: "#fff", borderRadius: 8, padding: "5px 10px", fontSize: 12, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}
                  >
                    📣 Notify customer
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const CUSTOM_PRODUCT_CATEGORIES = [
  "Everyday Essentials", "Bulbs", "Leafy Greens", "Fresh Herbs", "Brassicas",
  "Beans & Peas", "Mushrooms", "Specialty Vegetables", "Middle Eastern Favorites",
  "Fruits", "Gourmet & Gifts",
];
const CUSTOM_PRODUCT_UNITS = ["piece", "kg", "250g", "500g", "bunch", "box", "set"];

function CustomProductManager({ customProducts, addCustomProduct, updateCustomProduct, deleteCustomProduct }) {
  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [category, setCategory] = useState(CUSTOM_PRODUCT_CATEGORIES[0]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [unit, setUnit] = useState("piece");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadPct, setUploadPct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const fileInputRef = useRef(null);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function resetForm() {
    setName(""); setNameAr(""); setCategory(CUSTOM_PRODUCT_CATEGORIES[0]); setNewCategoryName(""); setUnit("piece");
    setPrice(""); setDescription(""); setDescriptionAr(""); setPhotoUrl(""); setPhotoFile(null); setPhotoPreview(null);
  }

  async function handleAdd() {
    const finalCategory = category === "__new__" ? newCategoryName.trim() : category;
    if (!name.trim() || !price || !finalCategory || saving) return;
    setSaving(true);
    setSaveMsg("");
    const id = slugify(name.trim()) + "-" + Date.now().toString(36).slice(-4); // unique even if the name repeats
    let finalPhotoUrl = photoUrl.trim() || null;
    try {
      if (photoFile) finalPhotoUrl = await uploadProductPhoto(photoFile, id, setUploadPct);
    } catch {
      setSaveMsg("⚠ Photo upload failed — saved without a photo. You can add one later.");
    }
    const product = {
      id,
      name: name.trim(),
      nameAr: nameAr.trim() || null,
      category: finalCategory,
      unit,
      price: Number(price) || 0,
      available: true,
      description: description.trim() || null,
      descriptionAr: descriptionAr.trim() || null,
      photoUrl: finalPhotoUrl,
      origin: null, // can be set later via updateCustomProduct if needed
      custom: true, // flags this as admin-created, not part of the built-in catalog
    };
    const ok = await addCustomProduct(product);
    setSaving(false);
    if (ok) {
      setSaveMsg(`✓ "${product.name}" added — it's live on the site now.`);
      resetForm();
    } else if (!saveMsg) {
      setSaveMsg("⚠ Failed to save — try again.");
    }
    setTimeout(() => setSaveMsg(""), 5000);
  }

  return (
    <div>
      <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Add a New Product</div>
      <p style={{ fontSize: 12.5, opacity: 0.65, marginBottom: 18, maxWidth: 560 }}>
        Add a product that isn't part of the built-in catalog — it appears on the site immediately, in whichever category you choose, with its own price, description, and photo.
      </p>

      <div style={{ background: "#fff", border: `1px solid ${BRAND.creamDeep}`, borderRadius: 14, padding: 18, maxWidth: 480, marginBottom: 28 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label style={{ fontSize: 12 }}>
              Name (English)
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Passion Fruit" style={{ ...inputStyle, marginTop: 4, width: "100%" }} />
            </label>
            <label style={{ fontSize: 12 }}>
              Name (Arabic) — optional
              <input type="text" dir="rtl" value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="فاكهة العشق" style={{ ...inputStyle, marginTop: 4, width: "100%" }} />
            </label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <label style={{ fontSize: 12 }}>
              Category
              <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...inputStyle, marginTop: 4, width: "100%" }}>
                {CUSTOM_PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                <option value="__new__">+ New category…</option>
              </select>
              {category === "__new__" && (
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Juices"
                  style={{ ...inputStyle, marginTop: 6, width: "100%" }}
                />
              )}
            </label>
            <label style={{ fontSize: 12 }}>
              Unit
              <select value={unit} onChange={(e) => setUnit(e.target.value)} style={{ ...inputStyle, marginTop: 4, width: "100%" }}>
                {CUSTOM_PRODUCT_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </label>
            <label style={{ fontSize: 12 }}>
              Price (AED)
              <input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" style={{ ...inputStyle, marginTop: 4, width: "100%" }} />
            </label>
          </div>
          <label style={{ fontSize: 12 }}>
            Description (English) — optional
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} style={{ ...inputStyle, marginTop: 4, width: "100%", resize: "vertical", fontFamily: "inherit" }} />
          </label>
          <label style={{ fontSize: 12 }}>
            Description (Arabic) — optional
            <textarea dir="rtl" value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} rows={2} style={{ ...inputStyle, marginTop: 4, width: "100%", resize: "vertical", fontFamily: "inherit" }} />
          </label>

          <div>
            <div style={{ fontSize: 12, marginBottom: 6 }}>Photo</div>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFile} style={{ display: "none" }} />
            {photoPreview ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <img src={photoPreview} alt="" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8 }} />
                <GhostButton onClick={() => { setPhotoFile(null); setPhotoPreview(null); }} style={{ fontSize: 12 }}>Remove</GhostButton>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <GhostButton onClick={() => fileInputRef.current?.click()} style={{ fontSize: 12.5 }}>📷 Upload a photo</GhostButton>
                <span style={{ fontSize: 11, opacity: 0.5 }}>or</span>
                <input type="text" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="paste an image URL instead" style={{ ...inputStyle, fontSize: 12, padding: "6px 8px", width: 200 }} />
              </div>
            )}
            {uploadPct !== null && uploadPct < 100 && <div style={{ fontSize: 11, opacity: 0.6, marginTop: 6 }}>Uploading… {uploadPct}%</div>}
            <div style={{ fontSize: 10.5, opacity: 0.5, marginTop: 4 }}>
              Photo upload needs Firebase Storage on the Blaze (paid) plan — if that's not set up yet, paste an image URL instead as a reliable fallback.
            </div>
          </div>

          <PrimaryButton onClick={handleAdd} full style={{ opacity: saving ? 0.6 : 1 }}>
            {saving ? "Adding…" : "Add Product"}
          </PrimaryButton>
          {saveMsg && <div style={{ fontSize: 12.5, color: saveMsg.startsWith("⚠") ? BRAND.tomato : BRAND.green, fontWeight: 700 }}>{saveMsg}</div>}
        </div>
      </div>

      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Custom Products ({customProducts.length})</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {customProducts.length === 0 && <div style={{ opacity: 0.5, fontSize: 13 }}>No custom products added yet.</div>}
        {customProducts.map((p) => (
          <CustomProductRow key={p.id} product={p} updateCustomProduct={updateCustomProduct} deleteCustomProduct={deleteCustomProduct} />
        ))}
      </div>
    </div>
  );
}

function CustomProductRow({ product, updateCustomProduct, deleteCustomProduct }) {
  const [price, setPrice] = useState(product.price);
  const [justSaved, setJustSaved] = useState("");

  async function commitPrice(e) {
    if (e) e.target.blur();
    const ok = await updateCustomProduct(product.id, { price: Number(price) || 0 });
    setJustSaved(ok ? "saved" : "failed");
    setTimeout(() => setJustSaved(""), ok ? 1500 : 5000);
  }

  return (
    <div style={{ background: "#fff", border: `1px solid ${BRAND.creamDeep}`, borderRadius: 14, padding: 12, display: "flex", alignItems: "center", gap: 12 }}>
      <Thumb product={product} size={48} radius={10} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5 }}>{product.name}</div>
        <div style={{ fontSize: 11.5, opacity: 0.6 }}>{product.category} · {product.unit}</div>
      </div>
      <input
        type="number"
        min="0"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        onBlur={commitPrice}
        onKeyDown={(e) => e.key === "Enter" && commitPrice(e)}
        style={{ ...inputStyle, padding: "6px 8px", width: 70 }}
      />
      {justSaved === "saved" && <span style={{ color: BRAND.green, fontSize: 11, fontWeight: 700 }}>✓</span>}
      {justSaved === "failed" && <span style={{ color: BRAND.tomato, fontSize: 11, fontWeight: 700 }}>⚠</span>}
      <button
        onClick={() => updateCustomProduct(product.id, { available: !product.available })}
        style={{
          border: "none", borderRadius: 999, padding: "6px 12px", cursor: "pointer", fontWeight: 700, fontSize: 12,
          background: product.available ? BRAND.greenSoft : "#F2D9CE", color: product.available ? BRAND.green : BRAND.tomato,
        }}
      >
        {product.available ? "Available" : "Hidden"}
      </button>
      <button
        onClick={() => window.confirm(`Delete "${product.name}" permanently?`) && deleteCustomProduct(product.id)}
        style={{ background: "none", border: "none", color: BRAND.tomato, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
      >
        Delete
      </button>
    </div>
  );
}

function CustomerExport({ orders, reviews }) {
  const [profiles, setProfiles] = useState(null); // null = not loaded yet
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const list = await fetchAllProfiles();
    setProfiles(list);
    setLoading(false);
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const rows = (profiles || []).map((p) => {
    const customerOrders = orders.filter((o) => o.customer?.uid === p.uid || (p.email && o.customer?.email === p.email));
    const reviewCount = reviews.filter((r) => {
      const matchingOrder = orders.find((o) => o.id === r.orderId);
      return matchingOrder && (matchingOrder.customer?.uid === p.uid);
    }).length;
    return {
      name: p.name || "",
      email: p.email || "",
      phone: p.phone || "",
      loyaltyPoints: p.loyaltyPoints || 0,
      orderCount: customerOrders.length,
      totalSpent: customerOrders.reduce((s, o) => s + (o.total || 0), 0),
      reviewCount,
    };
  }).filter((r) => r.email); // skip anything without an email — not useful for a mailing list

  function downloadCsv() {
    const header = ["Name", "Email", "Phone", "Loyalty Points", "Orders Placed", "Total Spent (AED)", "Reviews Left"];
    const lines = [header, ...rows.map((r) => [r.name, r.email, r.phone, r.loyaltyPoints, r.orderCount, r.totalSpent.toFixed(2), r.reviewCount])];
    const csv = lines.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `darousha-fresh-customers-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Registered Customers</div>
      <p style={{ fontSize: 12.5, opacity: 0.65, marginBottom: 16, maxWidth: 560 }}>
        Every customer who's created an account, with their email for marketing use, how many orders they've placed, and how many reviews they've left. Only accounts with an email on file are shown.
      </p>

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <GhostButton onClick={load} style={{ opacity: loading ? 0.6 : 1 }}>{loading ? "Loading…" : "↻ Refresh"}</GhostButton>
        <PrimaryButton onClick={downloadCsv} disabled={rows.length === 0}>⬇ Download CSV ({rows.length})</PrimaryButton>
      </div>

      {profiles === null || loading ? (
        <div style={{ opacity: 0.5, fontSize: 13 }}>Loading customers…</div>
      ) : rows.length === 0 ? (
        <div style={{ opacity: 0.5, fontSize: 13 }}>No registered customers with an email yet.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: `2px solid ${BRAND.creamDeep}` }}>
                <th style={{ padding: "8px 10px" }}>Name</th>
                <th style={{ padding: "8px 10px" }}>Email</th>
                <th style={{ padding: "8px 10px" }}>Phone</th>
                <th style={{ padding: "8px 10px", textAlign: "right" }}>Points</th>
                <th style={{ padding: "8px 10px", textAlign: "right" }}>Orders</th>
                <th style={{ padding: "8px 10px", textAlign: "right" }}>Spent (AED)</th>
                <th style={{ padding: "8px 10px", textAlign: "right" }}>Reviews</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.email} style={{ borderBottom: `1px solid ${BRAND.creamDeep}` }}>
                  <td style={{ padding: "8px 10px" }}>{r.name}</td>
                  <td style={{ padding: "8px 10px" }}>{r.email}</td>
                  <td style={{ padding: "8px 10px" }}>{r.phone}</td>
                  <td style={{ padding: "8px 10px", textAlign: "right" }}>{r.loyaltyPoints}</td>
                  <td style={{ padding: "8px 10px", textAlign: "right" }}>{r.orderCount}</td>
                  <td style={{ padding: "8px 10px", textAlign: "right" }}>{r.totalSpent.toFixed(2)}</td>
                  <td style={{ padding: "8px 10px", textAlign: "right" }}>{r.reviewCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SubscriptionsPanel() {
  const [subs, setSubs] = useState(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setSubs(await fetchAllSubscriptions());
    setLoading(false);
  }
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const active = (subs || []).filter((s) => s.status === "active");
  const paused = (subs || []).filter((s) => s.status === "paused");
  const in7Days = active.filter((s) => new Date(s.nextDeliveryDate) <= new Date(Date.now() + 7 * 86400000));

  return (
    <div>
      <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Recurring Subscriptions</div>
      <p style={{ fontSize: 12.5, opacity: 0.65, marginBottom: 16, maxWidth: 620 }}>
        Every customer on an automatic recurring order. A due subscription turns into a real order in your Orders tab on its own the next time anyone opens the app — nothing for you to trigger manually.
      </p>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
        <div style={{ background: "#fff", border: `1px solid ${BRAND.creamDeep}`, borderRadius: 14, padding: 16, flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.6, textTransform: "uppercase" }}>Active</div>
          <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 800, fontSize: 24, color: BRAND.green }}>{active.length}</div>
        </div>
        <div style={{ background: "#fff", border: `1px solid ${BRAND.creamDeep}`, borderRadius: 14, padding: 16, flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.6, textTransform: "uppercase" }}>Paused</div>
          <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 800, fontSize: 24, color: BRAND.orangeDeep }}>{paused.length}</div>
        </div>
        <div style={{ background: "#fff", border: `1px solid ${BRAND.creamDeep}`, borderRadius: 14, padding: 16, flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.6, textTransform: "uppercase" }}>Due within 7 days</div>
          <div style={{ fontFamily: "Playfair Display, serif", fontWeight: 800, fontSize: 24, color: BRAND.green }}>{in7Days.length}</div>
        </div>
      </div>

      <GhostButton onClick={load} style={{ marginBottom: 16, opacity: loading ? 0.6 : 1 }}>{loading ? "Loading…" : "↻ Refresh"}</GhostButton>

      {subs === null || loading ? (
        <div style={{ opacity: 0.5, fontSize: 13 }}>Loading…</div>
      ) : subs.length === 0 ? (
        <div style={{ opacity: 0.5, fontSize: 13 }}>No one has subscribed yet.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: `2px solid ${BRAND.creamDeep}` }}>
                <th style={{ padding: "8px 10px" }}>Customer</th>
                <th style={{ padding: "8px 10px" }}>Items</th>
                <th style={{ padding: "8px 10px" }}>Frequency</th>
                <th style={{ padding: "8px 10px" }}>Next Delivery</th>
                <th style={{ padding: "8px 10px" }}>Status</th>
                <th style={{ padding: "8px 10px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subs.slice().sort((a, b) => new Date(a.nextDeliveryDate) - new Date(b.nextDeliveryDate)).map((s) => (
                <tr key={s.id} style={{ borderBottom: `1px solid ${BRAND.creamDeep}`, opacity: s.status === "cancelled" ? 0.4 : 1 }}>
                  <td style={{ padding: "8px 10px" }}>{s.customerName}<div style={{ opacity: 0.6, fontSize: 11 }}>{s.customerPhone}</div></td>
                  <td style={{ padding: "8px 10px" }}>{(s.items || []).map((it) => it.name).join(", ")}</td>
                  <td style={{ padding: "8px 10px", textTransform: "capitalize" }}>{s.frequency}</td>
                  <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>{new Date(s.nextDeliveryDate).toLocaleDateString()}</td>
                  <td style={{ padding: "8px 10px", textTransform: "capitalize" }}>{s.status}</td>
                  <td style={{ padding: "8px 10px" }}>
                    {s.status !== "cancelled" && (
                      <div style={{ display: "flex", gap: 6 }}>
                        {s.status === "active" ? (
                          <button
                            onClick={async () => { await updateSubscriptionDoc(s.id, { status: "paused" }); load(); }}
                            style={{ background: "none", border: `1px solid ${BRAND.creamDeep}`, borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                          >
                            Pause
                          </button>
                        ) : (
                          <button
                            onClick={async () => { await updateSubscriptionDoc(s.id, { status: "active" }); load(); }}
                            style={{ background: "none", border: `1px solid ${BRAND.creamDeep}`, borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                          >
                            Resume
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            if (!window.confirm(`Cancel ${s.customerName}'s subscription? This can't be undone.`)) return;
                            await updateSubscriptionDoc(s.id, { status: "cancelled" });
                            load();
                          }}
                          style={{ background: "none", border: "none", color: BRAND.tomato, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function LowStockBanner({ products, suppliers, addSupplier, deleteSupplier }) {
  const [manageOpen, setManageOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [saving, setSaving] = useState(false);
  const [qtyToOrder, setQtyToOrder] = useState({}); // productId -> quantity, editable before sending/exporting

  const lowStock = products.filter((p) => typeof p.stock === "number" && p.stock <= LOW_STOCK_THRESHOLD && p.stock > 0);
  const outOfStock = products.filter((p) => typeof p.stock === "number" && p.stock <= 0);
  if (lowStock.length === 0 && outOfStock.length === 0) return null;

  const allLow = [...outOfStock, ...lowStock]; // out-of-stock first — most urgent

  // A sensible starting suggestion, not a real demand forecast — out-of-stock
  // items default to a flat 10, low-stock items default to topping back up
  // to a round 15. Both are just starting points; every quantity below is
  // directly editable before it's ever sent or exported.
  function suggestedQty(p) {
    if (qtyToOrder[p.id] != null) return qtyToOrder[p.id];
    return p.stock <= 0 ? 10 : Math.max(1, 15 - p.stock);
  }
  function qtyFor(p) {
    return suggestedQty(p);
  }

  function downloadReorderCsv() {
    const header = ["Category", "Product", "Unit", "Current Stock", "Status", "Qty to Order"];
    const rows = allLow.map((p) => [p.category, p.name, p.unit, p.stock, p.stock <= 0 ? "OUT OF STOCK" : "Low", qtyFor(p)]);
    const lines = [header, ...rows];
    const csv = lines.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `darousha-fresh-reorder-list-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleAddSupplier() {
    if (!newName.trim() || !newPhone.trim() || saving) return;
    setSaving(true);
    await addSupplier({ id: "SUP" + Date.now().toString(36).toUpperCase(), name: newName.trim(), phone: newPhone.trim() });
    setNewName("");
    setNewPhone("");
    setSaving(false);
  }

  const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId);
  // A real <a> link, not a JS-triggered window.open — that's what makes this
  // always work reliably, never blocked by a browser's popup blocker, the
  // same lesson learned from the customer-status WhatsApp button earlier.
  const supplierWhatsAppLink = selectedSupplier
    ? `https://wa.me/${phoneDigitsForWhatsApp(selectedSupplier.phone)}?text=${encodeURIComponent(
        `Hi ${selectedSupplier.name}, this is Darousha Fresh. We would like to order:\n\n` +
        allLow.map((p) => `• ${p.name}: ${qtyFor(p)} ${unitName(p.unit, "en")} (currently ${p.stock <= 0 ? "0, out of stock" : `${p.stock} left`})`).join("\n") +
        `\n\nPlease confirm your available quantities and delivery date. Thank you!`
      )}`
    : null;

  return (
    <div style={{ background: "#FBF0D9", border: `1px solid ${BRAND.gold}`, borderRadius: 12, padding: 14, marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
        <div style={{ fontWeight: 700, fontSize: 13.5, color: BRAND.orangeDeep }}>⚠️ Inventory needs attention</div>
        <GhostButton onClick={downloadReorderCsv} style={{ fontSize: 12, padding: "6px 12px", flexShrink: 0 }}>
          ⬇ Download Reorder List (CSV)
        </GhostButton>
      </div>
      {outOfStock.length > 0 && (
        <div style={{ fontSize: 12.5, marginBottom: 4 }}>
          <b>Out of stock ({outOfStock.length}):</b> {outOfStock.map((p) => p.name).join(", ")}
        </div>
      )}
      {lowStock.length > 0 && (
        <div style={{ fontSize: 12.5 }}>
          <b>Running low ({lowStock.length}, {LOW_STOCK_THRESHOLD} or fewer left):</b> {lowStock.map((p) => `${p.name} (${p.stock})`).join(", ")}
        </div>
      )}

      <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${BRAND.gold}55` }}>
        <button
          onClick={() => setListOpen((o) => !o)}
          style={{ background: "none", border: "none", color: BRAND.orangeDeep, fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0, marginBottom: 10 }}
        >
          {listOpen ? "Hide quantities" : "Review & edit quantities before sending"}
        </button>
        {listOpen && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12, maxHeight: 260, overflowY: "auto" }}>
            {allLow.map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, background: "#fff", borderRadius: 8, padding: "6px 10px" }}>
                <span style={{ flex: 1, fontWeight: 600 }}>{p.name}</span>
                <span style={{ opacity: 0.55, fontSize: 11 }}>{p.stock <= 0 ? "out of stock" : `${p.stock} left`}</span>
                <input
                  type="number"
                  min="0"
                  value={qtyFor(p)}
                  onChange={(e) => setQtyToOrder((prev) => ({ ...prev, [p.id]: Number(e.target.value) }))}
                  style={{ ...inputStyle, padding: "4px 6px", fontSize: 12.5, width: 60, textAlign: "center" }}
                />
                <span style={{ width: 40, opacity: 0.7 }}>{unitName(p.unit, "en")}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <select
            value={selectedSupplierId}
            onChange={(e) => setSelectedSupplierId(e.target.value)}
            style={{ ...inputStyle, padding: "7px 10px", fontSize: 12.5, width: 180 }}
          >
            <option value="">Choose a supplier…</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.phone}</option>)}
          </select>
          {supplierWhatsAppLink ? (
            <a
              href={supplierWhatsAppLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#25D366", color: "#fff", fontWeight: 700, fontSize: 12.5, padding: "8px 14px", borderRadius: 8, textDecoration: "none" }}
            >
              <Phone size={13} /> Send to {selectedSupplier.name}
            </a>
          ) : (
            <span style={{ fontSize: 11.5, opacity: 0.5 }}>Pick a supplier to send this list to their WhatsApp</span>
          )}
          <button
            onClick={() => setManageOpen((o) => !o)}
            style={{ background: "none", border: "none", color: BRAND.orangeDeep, fontSize: 12, fontWeight: 700, cursor: "pointer", marginInlineStart: "auto" }}
          >
            {manageOpen ? "Hide suppliers" : "Manage suppliers"}
          </button>
        </div>

        {manageOpen && (
          <div style={{ marginTop: 12 }}>
            {suppliers.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                {suppliers.map((s) => (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, background: "#fff", borderRadius: 8, padding: "6px 10px" }}>
                    <span style={{ fontWeight: 700 }}>{s.name}</span>
                    <span style={{ opacity: 0.6 }}>{s.phone}</span>
                    <button
                      onClick={() => deleteSupplier(s.id)}
                      style={{ background: "none", border: "none", color: BRAND.tomato, fontSize: 11.5, fontWeight: 700, cursor: "pointer", marginInlineStart: "auto" }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Supplier name" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12.5, width: 160 }} />
              <input type="text" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="WhatsApp number (e.g. 9715xxxxxxxx)" style={{ ...inputStyle, padding: "7px 10px", fontSize: 12.5, width: 200 }} />
              <GhostButton onClick={handleAddSupplier} style={{ fontSize: 12, padding: "7px 14px", opacity: saving ? 0.6 : 1 }}>
                {saving ? "Adding…" : "+ Add supplier"}
              </GhostButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CatalogRow({ product, updateProduct }) {
  const [price, setPrice] = useState(product.price);
  const [stock, setStock] = useState(product.stock == null ? "" : product.stock);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [originOpen, setOriginOpen] = useState(false);
  const [shippingOpen, setShippingOpen] = useState(false);
  const [origin, setOrigin] = useState(product.origin || "");
  const [salePrice, setSalePrice] = useState(product.salePrice == null ? "" : product.salePrice);
  const [tierPiecesOpen, setTierPiecesOpen] = useState(false);
  const savedTiers = product.tierPieces || {};
  const [tierSmall, setTierSmall] = useState(savedTiers.small ?? 1);
  const [tierMedium, setTierMedium] = useState(savedTiers.medium ?? 3);
  const [tierBig, setTierBig] = useState(savedTiers.big ?? 6);
  const [photoUrl, setPhotoUrl] = useState(product.photoUrl || "");
  const [uploadPct, setUploadPct] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [justSaved, setJustSaved] = useState(null); // null | "price" | "stock"
  const fileInputRef = useRef(null);
  const unitOptions = ["piece", "kg", "250g", "500g", "bunch", "box", "set"];
  const hasCustomPhoto = !!product.photoUrl;
  const hasDiscount = typeof product.salePrice === "number" && product.salePrice > 0 && product.salePrice < product.price;
  const hasOrigin = !!product.origin;
  const hasShipping = !!product.shippingMethod;
  const showsTierPieces = product.unit === "piece" || product.unit === "bunch";
  const hasCustomTiers = !!product.tierPieces;

  async function commitOrigin() {
    const ok = await updateProduct(product.id, { origin: origin.trim() || null });
    setJustSaved(ok ? "origin" : "origin-failed");
    setTimeout(() => setJustSaved(null), ok ? 1500 : 5000);
  }

  async function commitShipping(method) {
    // Tap the same option again to clear it back to "not set" rather than
    // forcing a choice — plenty of items shouldn't have this label at all.
    const next = product.shippingMethod === method ? null : method;
    const ok = await updateProduct(product.id, { shippingMethod: next });
    setJustSaved(ok ? "shipping" : "shipping-failed");
    setTimeout(() => setJustSaved(null), ok ? 1500 : 5000);
  }

  async function commitPrice(e) {
    if (e) e.target.blur();
    const ok = await updateProduct(product.id, { price: Number(price) || 0 });
    setJustSaved(ok ? "price" : "price-failed");
    setTimeout(() => setJustSaved(null), ok ? 1500 : 5000);
  }

  async function commitStock(e) {
    if (e) e.target.blur();
    const ok = await updateProduct(product.id, { stock: stock === "" ? null : Math.max(0, Number(stock) || 0) });
    setJustSaved(ok ? "stock" : "stock-failed");
    setTimeout(() => setJustSaved(null), ok ? 1500 : 5000);
  }

  async function commitSalePrice() {
    const n = salePrice === "" ? null : Math.max(0, Number(salePrice) || 0);
    if (n !== null && n >= product.price) {
      window.alert("Sale price must be lower than the regular price to show as a discount.");
      return;
    }
    const ok = await updateProduct(product.id, { salePrice: n });
    setJustSaved(ok ? "salePrice" : "salePrice-failed");
    setTimeout(() => setJustSaved(null), ok ? 1500 : 5000);
  }

  async function commitTierPieces() {
    const small = Math.max(1, Number(tierSmall) || 1);
    const medium = Math.max(1, Number(tierMedium) || 1);
    const big = Math.max(1, Number(tierBig) || 1);
    if (!(small < medium && medium < big)) {
      window.alert("Each box size should have more pieces than the one before it (Small < Medium < Large).");
      return;
    }
    setTierSmall(small); setTierMedium(medium); setTierBig(big);
    const ok = await updateProduct(product.id, { tierPieces: { small, medium, big } });
    setJustSaved(ok ? "tierPieces" : "tierPieces-failed");
    setTimeout(() => setJustSaved(null), ok ? 1500 : 5000);
  }

  async function resetTierPieces() {
    setTierSmall(1); setTierMedium(3); setTierBig(6);
    const ok = await updateProduct(product.id, { tierPieces: null });
    setJustSaved(ok ? "tierPieces" : "tierPieces-failed");
    setTimeout(() => setJustSaved(null), ok ? 1500 : 5000);
  }


  async function handleFileChosen(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploadError("");
    setUploadPct(0);
    try {
      const url = await uploadProductPhoto(file, product.id, setUploadPct);
      setPhotoUrl(url);
      await updateProduct(product.id, { photoUrl: url });
    } catch (err) {
      console.error("Photo upload failed", err);
      let msg;
      if (err && err.code === "storage/unauthorized") {
        msg = "Blocked by Storage rules — allow writes to product-photos/ in Firebase Console → Storage → Rules.";
      } else if (err && err.code === "storage/unknown") {
        msg = "Firebase Storage may not be set up yet — go to Firebase Console → Storage and click \"Get started\" for this project, then try again.";
      } else if (err && String(err.message || "").startsWith("timeout")) {
        msg = "No response after 25s — most likely Storage isn't enabled for this Firebase project yet (Console → Storage → Get started), or something on this network is blocking the request.";
      } else {
        msg = `Upload failed${err && err.code ? ` (${err.code})` : ""}${err && err.message ? `: ${err.message}` : " — check your connection and try again."}`;
      }
      setUploadError(msg);
    } finally {
      setUploadPct(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div style={{ borderTop: `1px solid ${BRAND.creamDeep}` }}>
      <div style={{ display: "grid", gridTemplateColumns: "auto 2fr 1fr 1fr 1fr 1fr auto", padding: "10px 16px", alignItems: "center", fontSize: 13.5, gap: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
          <Thumb product={product} size={32} radius={8} />
        </div>
        <div>{product.name}</div>
        <div>
          <select
            value={product.unit}
            onChange={(e) => updateProduct(product.id, { unit: e.target.value })}
            style={{ ...inputStyle, padding: "5px 6px", fontSize: 12.5, width: "90%" }}
          >
            {(unitOptions.includes(product.unit) ? unitOptions : [product.unit, ...unitOptions]).map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            onBlur={commitPrice}
            onKeyDown={(e) => e.key === "Enter" && commitPrice(e)}
            style={{ ...inputStyle, padding: "6px 8px", width: 70 }}
          />
          {justSaved === "price" && <span style={{ color: BRAND.green, fontSize: 11, fontWeight: 700 }}>✓</span>}
          {justSaved === "price-failed" && <span title="Failed to save — try again" style={{ color: BRAND.tomato, fontSize: 11, fontWeight: 700 }}>⚠</span>}
          <button
            onClick={() => setDiscountOpen((o) => !o)}
            title={hasDiscount ? `On sale: ${money(product.salePrice)}` : "Add a discount price"}
            style={{
              border: `1px solid ${hasDiscount ? BRAND.tomato : BRAND.creamDeep}`, borderRadius: 8, padding: "5px 7px", cursor: "pointer",
              background: hasDiscount ? "#FDEAEA" : "#fff", color: hasDiscount ? BRAND.tomato : BRAND.ink, fontSize: 12, flexShrink: 0,
            }}
          >
            🏷️
          </button>
          {showsTierPieces && (
            <button
              onClick={() => setTierPiecesOpen((o) => !o)}
              title={hasCustomTiers ? `Custom box sizes: ${product.tierPieces.small}/${product.tierPieces.medium}/${product.tierPieces.big} pieces` : "Edit how many pieces go in each box size"}
              style={{
                border: `1px solid ${hasCustomTiers ? BRAND.green : BRAND.creamDeep}`, borderRadius: 8, padding: "5px 7px", cursor: "pointer",
                background: hasCustomTiers ? BRAND.greenSoft : "#fff", color: hasCustomTiers ? BRAND.green : BRAND.ink, fontSize: 12, flexShrink: 0,
              }}
            >
              📦
            </button>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input
            type="number"
            min="0"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            onBlur={commitStock}
            onKeyDown={(e) => e.key === "Enter" && commitStock(e)}
            placeholder="∞"
            title="Leave blank for unlimited stock"
            style={{ ...inputStyle, padding: "6px 8px", width: 60 }}
          />
          {justSaved === "stock" && <span style={{ color: BRAND.green, fontSize: 11, fontWeight: 700 }}>✓</span>}
          {justSaved === "stock-failed" && <span title="Failed to save — try again" style={{ color: BRAND.tomato, fontSize: 11, fontWeight: 700 }}>⚠</span>}
        </div>
        <div>
          <button
            onClick={() => updateProduct(product.id, { available: !product.available })}
            style={{
              border: "none", borderRadius: 999, padding: "6px 12px", cursor: "pointer", fontWeight: 700, fontSize: 12,
              background: product.available ? BRAND.greenSoft : "#F2D9CE",
              color: product.available ? BRAND.green : BRAND.tomato,
            }}
          >
            {product.available ? "In stock" : "Out of stock"}
          </button>
        </div>
        <button
          onClick={() => setPhotoOpen((o) => !o)}
          title={hasCustomPhoto ? "Custom photo set" : "Add a photo"}
          style={{
            border: `1px solid ${hasCustomPhoto ? BRAND.green : BRAND.creamDeep}`, borderRadius: 8, padding: "6px 9px", cursor: "pointer",
            background: hasCustomPhoto ? BRAND.greenSoft : "#fff", color: hasCustomPhoto ? BRAND.green : BRAND.ink, fontSize: 12,
          }}
        >
          📷
        </button>
        <button
          onClick={() => setOriginOpen((o) => !o)}
          title={hasOrigin ? `Origin: ${product.origin}` : "Set country of origin"}
          style={{
            border: `1px solid ${hasOrigin ? BRAND.green : BRAND.creamDeep}`, borderRadius: 8, padding: "6px 9px", cursor: "pointer",
            background: hasOrigin ? BRAND.greenSoft : "#fff", color: hasOrigin ? BRAND.green : BRAND.ink, fontSize: 12,
          }}
        >
          🌍
        </button>
        <button
          onClick={() => setShippingOpen((o) => !o)}
          title={hasShipping ? product.shippingMethod : "Set shipping method (optional)"}
          style={{
            border: `1px solid ${hasShipping ? BRAND.green : BRAND.creamDeep}`, borderRadius: 8, padding: "6px 9px", cursor: "pointer",
            background: hasShipping ? BRAND.greenSoft : "#fff", color: hasShipping ? BRAND.green : BRAND.ink, fontSize: 12,
          }}
        >
          {product.shippingMethod === "Air Freight" ? "✈️" : product.shippingMethod === "Road Freight" ? "🚚" : "✈️"}
        </button>
      </div>
      {originOpen && (
        <div style={{ padding: "0 16px 14px 58px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontSize: 11.5, opacity: 0.6 }}>Country of origin:</div>
          <input
            type="text"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && commitOrigin()}
            placeholder="e.g. Turkey, Lebanon, UAE"
            style={{ ...inputStyle, padding: "7px 10px", fontSize: 12.5, width: 160 }}
          />
          <GhostButton style={{ padding: "7px 12px", fontSize: 12.5 }} onClick={commitOrigin}>
            Save
          </GhostButton>
          {justSaved === "origin" && <span style={{ color: BRAND.green, fontSize: 11, fontWeight: 700 }}>✓ Saved</span>}
          {justSaved === "origin-failed" && <span style={{ color: BRAND.tomato, fontSize: 11, fontWeight: 700 }}>⚠ Failed to save — try again</span>}
          <div style={{ fontSize: 10.5, opacity: 0.5, width: "100%" }}>
            UAE food labeling rules require country of origin on imported items — this also shows to customers on the shop page once set.
          </div>
        </div>
      )}
      {shippingOpen && (
        <div style={{ padding: "0 16px 14px 58px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontSize: 11.5, opacity: 0.6 }}>Shipping method (optional):</div>
          <button
            onClick={() => commitShipping("Air Freight")}
            style={{
              border: `1px solid ${product.shippingMethod === "Air Freight" ? BRAND.green : BRAND.creamDeep}`, borderRadius: 8, padding: "7px 12px", cursor: "pointer",
              background: product.shippingMethod === "Air Freight" ? BRAND.greenSoft : "#fff", color: product.shippingMethod === "Air Freight" ? BRAND.green : BRAND.ink, fontSize: 12.5, fontWeight: 700,
            }}
          >
            ✈️ Air Freight
          </button>
          <button
            onClick={() => commitShipping("Road Freight")}
            style={{
              border: `1px solid ${product.shippingMethod === "Road Freight" ? BRAND.green : BRAND.creamDeep}`, borderRadius: 8, padding: "7px 12px", cursor: "pointer",
              background: product.shippingMethod === "Road Freight" ? BRAND.greenSoft : "#fff", color: product.shippingMethod === "Road Freight" ? BRAND.green : BRAND.ink, fontSize: 12.5, fontWeight: 700,
            }}
          >
            🚚 Road Freight
          </button>
          {justSaved === "shipping" && <span style={{ color: BRAND.green, fontSize: 11, fontWeight: 700 }}>✓ Saved</span>}
          {justSaved === "shipping-failed" && <span style={{ color: BRAND.tomato, fontSize: 11, fontWeight: 700 }}>⚠ Failed to save — try again</span>}
          <div style={{ fontSize: 10.5, opacity: 0.5, width: "100%" }}>
            Optional — a freshness/marketing signal, not a compliance requirement. Tap the selected option again to clear it. Leave unset for items where it doesn't add value.
          </div>
        </div>
      )}
      {discountOpen && (
        <div style={{ padding: "0 16px 14px 58px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontSize: 11.5, opacity: 0.6 }}>Sale price (AED):</div>
            <input
              type="number"
              min="0"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && commitSalePrice()}
              placeholder={`below ${money(product.price)}`}
              style={{ ...inputStyle, padding: "7px 10px", fontSize: 12.5, width: 110 }}
            />
            <GhostButton
              style={{ padding: "7px 12px", fontSize: 12.5 }}
              onClick={commitSalePrice}
            >
              Save discount
            </GhostButton>
            {justSaved === "salePrice" && <span style={{ color: BRAND.green, fontSize: 11, fontWeight: 700 }}>✓ Saved</span>}
            {justSaved === "salePrice-failed" && <span style={{ color: BRAND.tomato, fontSize: 11, fontWeight: 700 }}>⚠ Failed to save — try again</span>}
            {hasDiscount && (
              <button
                onClick={() => { setSalePrice(""); updateProduct(product.id, { salePrice: null }); }}
                style={{ background: "none", border: "none", color: BRAND.tomato, fontSize: 12, cursor: "pointer", fontWeight: 600 }}
              >
                Remove discount
              </button>
            )}
          </div>
          <div style={{ fontSize: 11, opacity: 0.55 }}>
            Customers will see the regular price struck through next to this sale price, everywhere the item appears (shop, fruit box builder, cart, invoice). Leave blank and save to remove the discount.
          </div>
        </div>
      )}
      {tierPiecesOpen && (
        <div style={{ padding: "0 16px 14px 58px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 10.5, opacity: 0.6, marginBottom: 3 }}>Small</div>
              <input type="number" min="1" value={tierSmall} onChange={(e) => setTierSmall(e.target.value)} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12.5, width: 60 }} />
            </div>
            <div>
              <div style={{ fontSize: 10.5, opacity: 0.6, marginBottom: 3 }}>Medium</div>
              <input type="number" min="1" value={tierMedium} onChange={(e) => setTierMedium(e.target.value)} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12.5, width: 60 }} />
            </div>
            <div>
              <div style={{ fontSize: 10.5, opacity: 0.6, marginBottom: 3 }}>Large</div>
              <input type="number" min="1" value={tierBig} onChange={(e) => setTierBig(e.target.value)} style={{ ...inputStyle, padding: "7px 10px", fontSize: 12.5, width: 60 }} />
            </div>
            <GhostButton style={{ padding: "7px 12px", fontSize: 12.5, alignSelf: "flex-end" }} onClick={commitTierPieces}>
              Save box sizes
            </GhostButton>
            {justSaved === "tierPieces" && <span style={{ color: BRAND.green, fontSize: 11, fontWeight: 700, alignSelf: "flex-end", marginBottom: 8 }}>✓ Saved</span>}
            {justSaved === "tierPieces-failed" && <span style={{ color: BRAND.tomato, fontSize: 11, fontWeight: 700, alignSelf: "flex-end", marginBottom: 8 }}>⚠ Failed to save — try again</span>}
            {hasCustomTiers && (
              <button onClick={resetTierPieces} style={{ background: "none", border: "none", color: BRAND.tomato, fontSize: 12, cursor: "pointer", fontWeight: 600, alignSelf: "flex-end", marginBottom: 8 }}>
                Reset to default (1/3/6)
              </button>
            )}
          </div>
          <div style={{ fontSize: 11, opacity: 0.55 }}>
            How many pieces go in the Small, Medium and Large box for this item — shown to customers on the shop page (e.g. "Large Box · {tierBig} pieces") and used to calculate each box's price. Must increase from Small to Large.
          </div>
        </div>
      )}
      {photoOpen && (
        <div style={{ padding: "0 16px 14px 58px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChosen}
              style={{ display: "none" }}
              id={`file-${product.id}`}
            />
            <GhostButton
              style={{ padding: "7px 12px", fontSize: 12.5 }}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
            >
              📁 Upload from device
            </GhostButton>
            {uploadPct !== null && (
              <div style={{ fontSize: 12, color: BRAND.green, fontWeight: 700 }}>Uploading… {uploadPct}%</div>
            )}
          </div>
          {uploadError && <div style={{ fontSize: 12, color: BRAND.tomato }}>{uploadError}</div>}

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontSize: 11.5, opacity: 0.5 }}>or paste a link instead:</div>
            <input
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="Image URL (jpg/png)…"
              style={{ ...inputStyle, padding: "7px 10px", fontSize: 12.5, flex: 1, minWidth: 200 }}
            />
            <GhostButton
              style={{ padding: "7px 12px", fontSize: 12.5 }}
              onClick={() => updateProduct(product.id, { photoUrl: photoUrl.trim() || null })}
            >
              Save link
            </GhostButton>
          </div>

          {hasCustomPhoto && (
            <div>
              <button
                onClick={() => { setPhotoUrl(""); updateProduct(product.id, { photoUrl: null }); }}
                style={{ background: "none", border: "none", color: BRAND.tomato, fontSize: 12, cursor: "pointer", fontWeight: 600 }}
              >
                Remove photo (revert to default)
              </button>
            </div>
          )}
          <div style={{ fontSize: 11, opacity: 0.55 }}>
            Uploaded photos go to Firebase Storage. If uploads fail with a permissions error, open Firebase Console → Storage → Rules and allow writes to the "product-photos/" path — Backstage isn't signed in with a staff account, so default rules will block it.
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------ Footer ------------------------------------ */

function Footer({ setView }) {
  const { t } = useLang();
  return (
    <footer className="no-print" style={{ background: BRAND.greenDark, color: BRAND.cream, marginTop: 40, padding: "28px 18px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Logo size={34} onDark />
          <span style={{ fontSize: 13, opacity: 0.75 }}>© {new Date().getFullYear()} Darousha Fresh</span>
        </div>
        <div style={{ display: "flex", gap: 18, fontSize: 13, alignItems: "center", flexWrap: "wrap" }}>
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="Instagram" style={{ ...footerLinkStyle, textDecoration: "none", display: "flex", alignItems: "center" }}>
            <Instagram size={17} />
          </a>
          <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" style={{ ...footerLinkStyle, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
            <Phone size={13} /> {formatPhoneDisplay(WHATSAPP_NUMBER)}
          </a>
          <button onClick={() => setView("about")} style={footerLinkStyle}>{t("footer_about")}</button>
          <button onClick={() => setView("recipes")} style={footerLinkStyle}>{t("footer_recipes")}</button>
          <button onClick={() => setView("blog")} style={footerLinkStyle}>{t("footer_blog")}</button>
          <button onClick={() => setView("location")} style={footerLinkStyle}>{t("footer_location")}</button>
          <button onClick={() => setView("privacy")} style={footerLinkStyle}>{t("footer_privacy")}</button>
          <button onClick={() => setView("terms")} style={footerLinkStyle}>{t("footer_terms")}</button>
          <button onClick={() => setView("track")} style={footerLinkStyle}>{t("footer_track")}</button>
          <button onClick={() => setView("admin")} style={footerLinkStyle}>{t("footer_backstage")}</button>
        </div>
      </div>
    </footer>
  );
}
const footerLinkStyle = { background: "none", border: "none", color: BRAND.cream, opacity: 0.8, cursor: "pointer", fontWeight: 600, padding: 0 };
