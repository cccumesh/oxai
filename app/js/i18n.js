const KEY = "sa-lang-v1";

export const LANGS = [
  { id: "roman", label: "Hindi" },
  { id: "hi", label: "हिंदी" },
  { id: "en", label: "English" },
  { id: "gu", label: "ગુજરાતી" },
  { id: "mr", label: "मराठी" },
];

function L(roman, hi, en, gu, mr) {
  return { roman, hi, en, gu, mr };
}

const rows = {
  language: L("Language", "भाषा", "Language", "ભાષા", "भाषा"),
  logout: L("Logout", "लॉगआउट", "Sign out", "લૉગઆઉટ", "लॉगआउट"),
  start_title: L("Shuru karo", "शुरू करो", "Welcome", "શરૂ કરો", "सुरू करा"),
  start_hint: L("Pehle yeh chuno.", "पहले ये चुनो।", "Choose how you want to continue.", "પહેલા આ પસંદ કરો.", "आधी हे निवडा."),
  new_account: L("Naya account", "नया अकाउंट", "Create account", "નવું અકાઉન્ટ", "नवे अकाउंट"),
  new_account_sub: L("Plant ka naya hisaab banana hai", "प्लांट का नया हिसाब बनाना है", "Set up a new plant workspace", "પ્લાન્ટનો નવો હિસાબ બનાવવો છે", "प्लांटचा नवा हिसाब बनवायचा आहे"),
  have_account: L("Pehle se account hai", "पहले से अकाउंट है", "I already have an account", "પહેલેથી અકાઉન્ટ છે", "आधीपासून अकाउंट आहे"),
  have_account_sub: L("Plant ya Delivery man login", "प्लांट या डिलीवरी मैन लॉगिन", "Sign in as plant or delivery associate", "પ્લાન્ટ કે ડિલિવરી મેન લોગિન", "प्लांट किंवा डिलिव्हरी मॅन लॉगिन"),
  back: L("← Peeche", "← पीछे", "← Back", "← પાછળ", "← मागे"),
  plant: L("Plant", "प्लांट", "Plant", "પ્લાન્ટ", "प्लांट"),
  delivery_man: L("Delivery man", "डिलीवरी मैन", "Delivery associate", "ડિલિવરી મેન", "डिलिव्हरी मॅन"),
  dm_login: L("Delivery man login", "डिलीवरी मैन लॉगिन", "Delivery sign-in", "ડિલિવરી મેન લોગિન", "डिलिव्हरी मॅन लॉगिन"),
  dm_login_hint: L("Company username + jo key plant ne di. Is phone pe logout tak login rahega.", "कंपनी यूजरनेम + जो की प्लांट ने दी। इस फोन पे लॉगआउट तक लॉगिन रहेगा।", "Use the company username and the key issued by the plant. You stay signed in on this phone until you sign out.", "કંપની યુઝરનેમ + જે કી પ્લાન્ટે આપી. આ ફોન પર લૉગઆઉટ સુધી લોગિન રહેશે.", "कंपनी युजरनेम + जी की प्लांटने दिली. या फोनवर लॉगआउट पर्यंत लॉगिन राहील."),
  wait_prefix: L("Ruko,", "रुको,", "Please wait", "રુકો,", "थांबा,"),
  wait_suffix: L("second baad try karo.", "सेकंड बाद ट्राय करो।", "seconds, then try again.", "સેકન્ડ પછી ટ્રાય કરો.", "सेकंदांनंतर ट्राय करा."),
  company_user: L("Company username", "कंपनी यूजरनेम", "Company username", "કંપની યુઝરનેમ", "कंपनी युजरनेम"),
  username: L("Username", "यूजरनेम", "Username", "યુઝરનેમ", "युजरनेम"),
  login_key: L("Login key", "लॉगिन की", "Access key", "લોગિન કી", "लॉगिन की"),
  password: L("Password", "पासवर्ड", "Password", "પાસવર્ડ", "पासवर्ड"),
  password_again: L("Password dubara", "पासवर्ड दुबारा", "Confirm password", "પાસવર્ડ ફરી", "पासवर्ड पुन्हा"),
  login: L("Login", "लॉगिन", "Sign in", "લોગિન", "लॉगिन"),
  wait_btn: L("Ruko…", "रुको…", "Please wait…", "રુકો…", "थांबा…"),
  plant_login: L("Plant login", "प्लांट लॉगिन", "Plant sign-in", "પ્લાન્ટ લોગિન", "प्लांट लॉगिन"),
  plant_login_hint: L("Ek baar login. Is phone pe logout tak dobara password nahi.", "एक बार लॉगिन। इस फोन पे लॉगआउट तक दोबारा पासवर्ड नहीं।", "Sign in once. This phone stays signed in until you sign out.", "એક વાર લોગિન. આ ફોન પર લૉગઆઉટ સુધી ફરી પાસવર્ડ નહીં.", "एकदा लॉगिन. या फोनवर लॉगआउट पर्यंत पुन्हा पासवर्ड नाही."),
  new_company_q: L("Nayi company?", "नयी कंपनी?", "New company?", "નવી કંપની?", "नवी कंपनी?"),
  create_account: L("Account banao", "अकाउंट बनाओ", "Create account", "અકાઉન્ટ બનાવો", "अकाउंट तयार करा"),
  new_company: L("Nayi company", "नयी कंपनी", "New company", "નવી કંપની", "नवी कंपनी"),
  signup_hint: L("Username unique hoga. Firm ka naam baad mein board wala.", "यूजरनेम यूनिक होगा। फर्म का नाम बाद में बोर्ड वाला।", "Username must be unique. Use the trading name that appears on invoices.", "યુઝરનેમ યુનિક હશે. ફર્મનું નામ પછી બોર્ડવાળું.", "युजरनेम युनिक असेल. फर्मचे नाव नंतर बोर्डवाले."),
  firm_name: L("Firm ka naam", "फर्म का नाम", "Company name", "ફર્મનું નામ", "फर्मचे नाव"),
  have_account_q: L("Pehle se account hai?", "पहले से अकाउंट है?", "Already registered?", "પહેલેથી અકાઉન્ટ છે?", "आधीपासून अकाउंट आहे?"),
  brand_tag: L("20 litre delivery · har plant ka apna hisaab", "20 लीटर डिलीवरी · हर प्लांट का अपना हिसाब", "20-litre jar delivery. One ledger per plant.", "20 લિટર ડિલિવરી · દરેક પ્લાન્ટનો પોતાનો હિસાબ", "20 लिटर डिलिव्हरी · प्रत्येक प्लांटचा स्वतःचा हिसाब"),
  first_day: L("pehla din", "पहला दिन", "earlier day", "પહેલો દિવસ", "पहिला दिवस"),
  live: L("Live", "लाइव", "Live", "લાઈવ", "लाइव्ह"),
  day_closed: L("Din band", "दिन बंद", "Day closed", "દિવસ બંધ", "दिवस बंद"),
  edit_allowed: L("Edit allowed", "एडिट चल सकता है", "Editing open", "એડિટ ચાલે છે", "एडिट चालू आहे"),
  today: L("Aaj", "आज", "Today", "આજે", "आज"),
  yesterday: L("Kal", "कल", "Yesterday", "ગઈકાલે", "काल"),
  days_ago_2: L("2 din pehle", "2 दिन पहले", "2 days ago", "2 દિવસ પહેલા", "2 दिवसांपूर्वी"),
  days_ago_3: L("3 din pehle", "3 दिन पहले", "3 days ago", "3 દિવસ પહેલા", "3 दिवसांपूर्वी"),
  today_route: L("aaj ka route", "आज का रूट", "today’s route", "આજનો રૂટ", "आजचा रूट"),
  yesterday_route: L("kal ka route", "कल का रूट", "yesterday’s route", "ગઈકાલનો રૂટ", "कालचा रूट"),
  dashboard: L("Dashboard", "डैशबोर्ड", "Dashboard", "ડેશબોર્ડ", "डॅशबोर्ड"),
  month: L("Mahina", "महीना", "Month", "મહિનો", "महिना"),
  pending: L("Pending", "पेंडिंग", "Outstanding", "પેન્ડિંગ", "पेंडिंग"),
  sheet: L("Sheet", "शीट", "Statement", "શીટ", "शीट"),
  route: L("Route", "रूट", "Route", "રૂટ", "रूट"),
  customers: L("Customers", "कस्टमर्स", "Customers", "કસ્ટમર્સ", "कस्टमर्स"),
  customer: L("Customer", "कस्टमर", "Customer", "કસ્ટમર", "कस्टमर"),
  new_plus: L("+ Naya", "+ नया", "+ New", "+ નવું", "+ नवे"),
  year: L("Saal", "साल", "Year", "વર્ષ", "वर्ष"),
  all: L("Sab", "सब", "All", "બધું", "सगळे"),
  from_start: L("Shuruaat se", "शुरुआत से", "All time", "શરૂઆતથી", "सुरूवातीपासून"),
  year_n: L("Saal {n}", "साल {n}", "{n}", "વર્ષ {n}", "वर्ष {n}"),
  market_pending: L("Market mein pending jar", "मार्केट में पेंडिंग जार", "Jars outstanding in market", "માર્કેટમાં પેન્ડિંગ જાર", "मार्केटमध्ये पेंडिंग जार"),
  given: L("Dale", "डाले", "Delivered", "આપ્યા", "दिले"),
  picked: L("Utaye", "उठाए", "Collected", "ઉઠાવ્યા", "उचलले"),
  back_pending: L("Wapas pending mein", "वापस पेंडिंग में", "Move back to pending", "પાછા પેન્ડિંગમાં", "परत पेंडिंगमध्ये"),
  pending_here: L("Pending jar — yahan uthana baki", "पेंडिंग जार — यहां उठाना बाकी", "Outstanding jars to collect here", "પેન્ડિંગ જાર — અહીં ઉઠાવવાના બાકી", "पेंडिंग जार — इथे उचलायचे बाकी"),
  jars_given: L("Kitne jar diye", "कितने जार दिए", "Jars delivered", "કેટલા જાર આપ્યા", "किती जार दिले"),
  empty_picked: L("Khali jar uthe", "खाली जार उठे", "Empties collected", "ખાલી જાર ઉઠ્યા", "रिकामी जार उचलली"),
  after_market: L("Iske baad market mein baki", "इसके बाद मार्केट में बाकी", "Jars remaining at this shop after", "આ પછી માર્કેટમાં બાકી", "यानंतर मार्केटमध्ये बाकी"),
  del_done: L("Delivery complete ✓", "डिलीवरी कंप्लीट ✓", "Mark delivered", "ડિલિવરી કમ્પ્લીટ ✓", "डिलिव्हरी कंप्लीट ✓"),
  cash_sold: L("Rokda becha", "रोकड़ा बेचा", "Cash sales", "રોકડા વેચ્યા", "रोकडा विकले"),
  plant_return: L("Plant wapas", "प्लांट वापस", "Plant returns", "પ્લાન્ટ પાછા", "प्लांट परत"),
  filled_from_plant: L("Plant se bhare gaye", "प्लांट से भरे गए", "Dispatched from plant", "પ્લાન્ટથી ભરેલા ગયા", "प्लांटहून भरले गेले"),
  route_plus_cash: L("Route dale + rokda", "रूट डाले + रोकड़ा", "Route + cash sales", "રૂટ આપ્યા + રોકડા", "रूट दिले + रोकडा"),
  broken_gone: L("Tuta (wapas nahi)", "टूटा (वापस नहीं)", "Broken (not returned)", "તૂટ્યું (પાછું નહીં)", "तुटले (परत नाही)"),
  leak_now_empty: L("Pani gira (ab khali, jar hai)", "पानी गिरा (अब खाली, जार है)", "Leak (now empty, jar intact)", "પાણી પડ્યું (હવે ખાલી, જાર છે)", "पाणी साचले (आता रिकामी, जार आहे)"),
  shop_empty: L("Shop se khali uthaye", "शॉप से खाली उठाए", "Empties from shops", "શોપથી ખાલી ઉઠાવ્યા", "शॉपवरून रिकामी उचलली"),
  filled_back: L("Bhare wapas", "भरे वापस", "Filled returns", "ભરેલા પાછા", "भरले परत"),
  empty_back: L("Khali wapas (shop + pani gira)", "खाली वापस (शॉप + पानी गिरा)", "Empty returns (shops + leaks)", "ખાલી પાછા (શોપ + પાણી પડ્યું)", "रिकामी परत (शॉप + पाणी साचले)"),
  total_vehicle: L("Total gadi mein wapas", "टोटल गाड़ी में वापस", "Total return to vehicle", "ટોટલ ગાડીમાં પાછા", "टोटल गाडीत परत"),
  leak_empty: L("Pani gira (ab khali)", "पानी गिरा (अब खाली)", "Leak (now empty)", "પાણી પડ્યું (હવે ખાલી)", "पाणी साचले (आता रिकामी)"),
  jar_broke: L("Jar toot gaya", "जार टूट गया", "Broken jar", "જાર તૂટી ગયો", "जार तुटले"),
  count_return: L("Total jar wapas laye (aap gino)", "टोटल जार वापस लाए (आप गिनो)", "Jars returned (your count)", "ટોટલ જાર પાછા લાવ્યા (તમે ગણો)", "टोटल जार परत आणली (तुम्ही मोजा)"),
  count_bad: L("Aapne {a} likhe, system kehta hai {b} hone chahiye. Gino phir se.", "आपने {a} लिखे, सिस्टम कहता है {b} होने चाहिए। गिनो फिर से।", "You entered {a}; the system expects {b}. Please recount.", "તમે {a} લખ્યા, સિસ્ટમ કહે છે {b} હોવા જોઈએ. ફરી ગણો.", "तुम्ही {a} लिहिले, सिस्टम म्हणतो {b} हवेत. पुन्हा मोजा."),
  count_ok: L("Hisaab match — {n} jar wapas.", "हिसाब मैच — {n} जार वापस।", "Count verified — {n} jars returned.", "હિસાબ મેચ — {n} જાર પાછા.", "हिसाब मॅच — {n} जार परत."),
  remaining: L("Baaki", "बाकी", "Pending", "બાકી", "बाकी"),
  complete: L("Complete", "कंप्लीट", "Completed", "કમ્પ્લીટ", "कंप्लीट"),
  jars_out: L("Jar diye", "जार दिए", "Delivered", "જાર આપ્યા", "जार दिले"),
  empty_short: L("Khali uthe", "खाली उठे", "Empties", "ખાલી ઉઠ્યા", "रिकामी उचलली"),
  vehicle_filled: L("Gadi mein bhare jar", "गाड़ी में भरे जार", "Loaded on vehicle", "ગાડીમાં ભરેલા જાર", "गाडीत भरले जार"),
  took_filled: L("Bhare leke gaye", "भरे लेके गए", "Loaded at plant", "ભરેલા લઈ ગયા", "भरले नेले"),
  sold: L("Bik gaye", "बिक गए", "Sold", "વેચાયા", "विकले"),
  now_vehicle: L("Ab gadi mein bhare", "अब गाड़ी में भरे", "Still on vehicle", "હવે ગાડીમાં ભરેલા", "आता गाडीत भरले"),
  leak_eq: L("Pani gira = khali", "पानी गिरा = खाली", "Leak = empty", "પાણી પડ્યું = ખાલી", "पाणी साचले = रिकामी"),
  stock_over: L("Bik gaye + pani/toot plant se leke gaye se zyada. Number check karo.", "बिक गए + पानी/टूट प्लांट से लेके गए से ज्यादा। नंबर चेक करो।", "Sold plus losses exceed the load taken from the plant. Check the figures.", "વેચાયા + પાણી/તૂટ પ્લાન્ટથી લઈ ગયા કરતા વધુ. નંબર ચેક કરો.", "विकले + पाणी/तुट प्लांटहून नेल्यापेक्षा जास्त. नंबर चेक करा."),
  all_done: L("Sab complete", "सब कंप्लीट", "Route complete", "બધું કમ્પ્લીટ", "सगळे कंप्लीट"),
  route_done_hint: L("Route complete. Neeche plant wapas hisaab bharo.", "रूट कंप्लीट। नीचे प्लांट वापस हिसाब भरो।", "Route complete. Enter plant returns below.", "રૂટ કમ્પ્લીટ. નીચે પ્લાન્ટ પાછા હિસાબ ભરો.", "रूट कंप्लीट. खाली प्लांट परत हिसाब भरा."),
  today_hisab: L("Aaj ka hisaab", "आज का हिसाब", "Today’s summary", "આજનો હિસાબ", "आजचा हिसाब"),
  took_short: L("Bhar ke gaye", "भर के गए", "Loaded", "ભરીને ગયા", "भरून गेले"),
  empty_plus_leak: L("Khali (uthaye + pani gira)", "खाली (उठाए + पानी गिरा)", "Empties (collected + leaks)", "ખાલી (ઉઠાવ્યા + પાણી પડ્યું)", "रिकामी (उचलली + पाणी साचले)"),
  route_gave: L("Route dale", "रूट डाले", "Route deliveries", "રૂટ આપ્યા", "रूट दिले"),
  total_sold: L("Total bika", "टोटल बिका", "Total sold", "ટોટલ વેચાયું", "टोटल विकले"),
  jar_broke_s: L("Jar toot", "जार टूट", "Broken", "જાર તૂટ", "जार तुट"),
  past_page: L("Yeh {when} wala page hai — aaj jaisa hi. Galat number ho to yahin theek karo.", "ये {when} वाला पेज है — आज जैसा ही। गलत नंबर हो तो यहीं ठीक करो।", "This is {when}. Same as today — correct any figures here.", "આ {when} વાળું પેજ છે — આજ જેવું જ. ખોટો નંબર હોય તો અહીં સુધારો.", "हे {when} चे पेज आहे — आजसारखेच. चुकीचा नंबर असेल तर इथे सुधारा."),
  route_pending: L("Is route ke pending jar (market)", "इस रूट के पेंडिंग जार (मार्केट)", "Outstanding jars on this route", "આ રૂટના પેન્ડિંગ જાર (માર્કેટ)", "या रूटचे पेंडिंग जार (मार्केट)"),
  left_cust: L("Baaki customers", "बाकी कस्टमर्स", "Remaining stops", "બાકી કસ્ટમર્સ", "बाकी कस्टमर्स"),
  sequence: L("Sequence", "सीक्वेंस", "Sequence", "સિક્વન્સ", "सीक्वेंस"),
  no_cust_add: L("Abhi koi customer nahi. Neeche + Naya se naam add karo.", "अभी कोई कस्टमर नहीं। नीचे + नया से नाम ऐड करो।", "No customers yet. Add a name with + New.", "હજુ કોઈ કસ્ટમર નથી. નીચે + નવું થી નામ ઉમેરો.", "अजून कोणता कस्टमर नाही. खाली + नवे ने नाव अॅड करा."),
  after_done: L("Complete ke baad yahan aayega.", "कंप्लीट के बाद यहां आएगा।", "Completed stops appear here.", "કમ્પ્લીટ પછી અહીં આવશે.", "कंप्लीट नंतर इथे येईल."),
  new_cust: L("+ Naya customer", "+ नया कस्टमर", "+ New customer", "+ નવો કસ્ટમર", "+ नवा कस्टमर"),
  speak: L("Naam bolo", "नाम बोलो", "Speak name", "નામ બોલો", "नाव बोला"),
  no_speak: L("Is phone pe naam bolne wala speaker nahi chala.", "इस फोन पे नाम बोलने वाला स्पीकर नहीं चला।", "This phone could not speak the name.", "આ ફોન પર નામ બોલનાર સ્પીકર ન ચાલ્યો.", "या फोनवर नाव बोलणारा स्पीकर चालला नाही."),
  seq_title: L("Delivery sequence", "डिलीवरी सीक्वेंस", "Delivery sequence", "ડિલિવરી સિક્વન્સ", "डिलिव्हरी सीक्वेंस"),
  back_route: L("← Route par wapas", "← रूट पर वापस", "← Back to route", "← રૂટ પર પાછા", "← रूटवर परत"),
  add_first: L("Pehle customer add karo.", "पहले कस्टमर ऐड करो।", "Add a customer first.", "પહેલા કસ્ટમર ઉમેરો.", "आधी कस्टमर अॅड करा."),
  my_cust: L("Mere customers", "मेरे कस्टमर्स", "My customers", "મારા કસ્ટમર્સ", "माझे कस्टमर्स"),
  empty_list: L("List khali hai. Apne route ke naam add karo.", "लिस्ट खाली है। अपने रूट के नाम ऐड करो।", "The list is empty. Add names on your route.", "લિસ્ટ ખાલી છે. તમારા રૂટના નામ ઉમેરો.", "लिस्ट रिकामी आहे. तुमच्या रूटची नावे अॅड करा."),
  edit: L("Edit", "एडिट", "Edit", "એડિટ", "एडिट"),
  pending_word: L("pending", "पेंडिंग", "outstanding", "પેન્ડિંગ", "पेंडिंग"),
  plant_dash: L("Plant dashboard", "प्लांट डैशबोर्ड", "Plant dashboard", "પ્લાન્ટ ડેશબોર્ડ", "प्लांट डॅशबोर्ड"),
  pick_month: L("Koi mahina chuno (bill / history)", "कोई महीना चुनो (बिल / हिस्ट्री)", "Select a month (invoice / history)", "કોઈ મહિનો પસંદ કરો (બિલ / હિસ્ટ્રી)", "एखादा महिना निवडा (बिल / हिस्ट्री)"),
  on_vehicle: L("Gadi pe bhare bache", "गाड़ी पे भरे बचे", "Loaded on vehicle", "ગાડી પર ભરેલા બચ્યા", "गाडीवर भरले बाकी"),
  filled_in: L("Plant pe bhare aaye", "प्लांट पे भरे आए", "Filled returned to plant", "પ્લાન્ટ પર ભરેલા આવ્યા", "प्लांटवर भरले आले"),
  shop_empty_in: L("Shop se khali aaye", "शॉप से खाली आए", "Empties from shops", "શોપથી ખાલી આવ્યા", "शॉपवरून रिकामी आली"),
  cap_leak: L("Cap khuli / pani gira", "कैप खुली / पानी गिरा", "Cap leak", "કેપ ખુલી / પાણી પડ્યું", "कॅप उघडी / पाणी साचले"),
  jars_broke: L("Jar toot gaye", "जार टूट गए", "Broken jars", "જાર તૂટી ગયા", "जार तुटली"),
  counted_need: L("Delivery man gine / hone chahiye", "डिलीवरी मैन गिने / होने चाहिए", "Counted / expected", "ડિલિવરી મેને ગણ્યા / હોવા જોઈએ", "डिलिव्हरी मॅन मोजले / हवेत"),
  dm_count_warn: L("Delivery man ne {a} gine, system kehta hai {b} wapas hone chahiye.", "डिलीवरी मैन ने {a} गिने, सिस्टम कहता है {b} वापस होने चाहिए।", "Associate counted {a}; the system expects {b} returned.", "ડિલિવરી મેને {a} ગણ્યા, સિસ્ટમ કહે છે {b} પાછા હોવા જોઈએ.", "डिलिव्हरी मॅनने {a} मोजले, सिस्टम म्हणतो {b} परत हवेत."),
  at_shops: L("Shop pe atke jar", "शॉप पे अटके जार", "Jars with shops", "શોપ પર અટકેલા જાર", "शॉपवर अडकले जार"),
  add: L("+ Add", "+ ऐड", "+ Add", "+ ઍડ", "+ अॅड"),
  took: L("Leke", "लेके", "Loaded", "લઈને", "नेले"),
  gave_s: L("dale", "डाले", "delivered", "આપ્યા", "दिले"),
  cap_s: L("cap", "कैप", "cap", "કેપ", "कॅप"),
  broke_s: L("toot", "टूट", "broken", "તૂટ", "तुट"),
  stuck_m: L("Market mein atke", "मार्केट में अटके", "With shops", "માર્કેટમાં અટક્યા", "मार्केटमध्ये अडकले"),
  counted_s: L("gine", "गिने", "counted", "ગણ્યા", "मोजले"),
  no_match: L("match nahi", "मैच नहीं", "mismatch", "મેચ નહીં", "मॅच नाही"),
  table: L("Table", "टेबल", "Ledger", "ટેબલ", "टेबल"),
  key: L("Key", "की", "Key", "કી", "की"),
  not_yet: L("abhi nahi", "अभी नहीं", "not set", "હજુ નહીં", "अजून नाही"),
  copy: L("Copy", "कॉपी", "Copy", "કોપી", "कॉपी"),
  make_key: L("Key banao", "की बनाओ", "Generate key", "કી બનાવો", "की तयार करा"),
  add_dm: L("Delivery man add karo. Unhe company username + login key do.", "डिलीवरी मैन ऐड करो। उन्हें कंपनी यूजरनेम + लॉगिन की दो।", "Add a delivery associate. Share the company username and access key.", "ડિલિવરી મેન ઉમેરો. તેમને કંપની યુઝરનેમ + લોગિન કી આપો.", "डिलिव्हरी मॅन अॅड करा. त्यांना कंपनी युजरनेम + लॉगिन की द्या."),
  search_cust: L("Naam / place dhoondo", "नाम / प्लेस ढूंढो", "Search name or area", "નામ / પ્લેસ શોધો", "नाव / प्लेस शोधा"),
  balance_sheet: L("Balance Sheet", "बैलेंस शीट", "Balance sheet", "બેલેન્સ શીટ", "बॅलन्स शीट"),
  approx: L("Approx", "अप्रोक्स", "Approx.", "અપ્રોક્સ", "अप्रोक्स"),
  left_jars: L("baki jar", "बाकी जार", "jars due", "બાકી જાર", "बाकी जार"),
  no_pending_j: L("Kisi ke paas pending jar nahi.", "किसी के पास पेंडिंग जार नहीं।", "No outstanding jars.", "કોઈ પાસે પેન્ડિંગ જાર નથી.", "कोणाकडे पेंडिंग जार नाही."),
  more_dm: L("+{n} aur is delivery man ke", "+{n} और इस डिलीवरी मैन के", "+{n} more on this associate", "+{n} વધુ આ ડિલિવરી મેનના", "+{n} आणखी या डिलिव्हरी मॅनचे"),
  on_route: L("{n} customer · inke route pe atke", "{n} कस्टमर · इनके रूट पे अटके", "{n} customers on this route", "{n} કસ્ટમર · આ રૂટ પર અટક્યા", "{n} कस्टमर · या रूटवर अडकले"),
  stuck_jars: L("atke jar", "अटके जार", "with shops", "અટકેલા જાર", "अडकले जार"),
  market_title: L("Jar pending in market", "जार पेंडिंग इन मार्केट", "Jars outstanding in market", "જાર પેન્ડિંગ ઇન માર્કેટ", "जार पेंडिंग इन मार्केट"),
  back_dash: L("← Dashboard", "← डैशबोर्ड", "← Dashboard", "← ડેશબોર્ડ", "← डॅशबोर्ड"),
  cap_title: L("Cap / pani gira", "कैप / पानी गिरा", "Cap leak", "કેપ / પાણી પડ્યું", "कॅप / पाणी साचले"),
  broke_title: L("Jar toot", "जार टूट", "Broken jars", "જાર તૂટ", "जार तुट"),
  both_loss: L("Cap + toot", "कैप + टूट", "Leak + broken", "કેપ + તૂટ", "कॅप + तुट"),
  both: L("Dono", "दोनों", "Both", "બંને", "दोन्ही"),
  cap_tab: L("Cap / gira", "कैप / गिरा", "Cap leak", "કેપ / પડ્યું", "कॅप / साचले"),
  broke_tab: L("Toot", "टूट", "Broken", "તૂટ", "तुट"),
  no_loss: L("Is period mein {x} nahi.", "इस पीरियड में {x} नहीं।", "No {x} in this period.", "આ પીરિયડમાં {x} નથી.", "या काळात {x} नाही."),
  no_broke: L("koi toot", "कोई टूट", "breakage", "કોઈ તૂટ", "कुठली तुट"),
  no_cap: L("koi pani gira", "कोई पानी गिरा", "cap leak", "કોઈ પાણી પડ્યું", "कुठले पाणी साचले"),
  no_both: L("cap/toot", "कैप/टूट", "leak or breakage", "કેપ/તૂટ", "कॅप/तुट"),
  leak_n: L("Pani gira {n}", "पानी गिरा {n}", "Leak {n}", "પાણી પડ્યું {n}", "पाणी साचले {n}"),
  broke_n: L("Toot {n}", "टूट {n}", "Broken {n}", "તૂટ {n}", "तुट {n}"),
  cap_broke_n: L("Cap {a} · toot {b}", "कैप {a} · टूट {b}", "Cap {a} · broken {b}", "કેપ {a} · તૂટ {b}", "कॅप {a} · तुट {b}"),
  leak_s: L("gira", "गिरा", "leak", "પડ્યું", "साचले"),
  total_s: L("total", "टोटल", "total", "ટોટલ", "टोटल"),
  took_gave: L("{a} bhar ke gaye · {b} dale", "{a} भर के गए · {b} डाले", "{a} loaded · {b} delivered", "{a} ભરીને ગયા · {b} આપ્યા", "{a} भरून गेले · {b} दिले"),
  today_gave: L("Aaj dale", "आज डाले", "Delivered today", "આજે આપ્યા", "आज दिले"),
  month_jars: L("Mahine ke jar", "महीने के जार", "This month", "મહિનાના જાર", "महिन्याचे जार"),
  year_jars: L("Saal ke jar", "साल के जार", "This year", "વર્ષના જાર", "वर्षाचे जार"),
  total_jars: L("Total jar", "टोटल जार", "Total jars", "ટોટલ જાર", "टोटल जार"),
  no_cust: L("Abhi koi customer nahi.", "अभी कोई कस्टमर नहीं।", "No customers yet.", "હજુ કોઈ કસ્ટમર નથી.", "अजून कोणता कस्टमर नाही."),
  no_cust_hit: L("Koi customer nahi mila.", "कोई कस्टमर नहीं मिला।", "No matching customer.", "કોઈ કસ્ટમર મળ્યો નહીં.", "कोणता कस्टमर सापडला नाही."),
  rate_none: L("Rate set nahi — pehle Rate dabao", "रेट सेट नहीं — पहले रेट दबाओ", "Rate not set — tap Rate first", "રેટ સેટ નથી — પહેલા રેટ દબાવો", "रेट सेट नाही — आधी रेट दाबा"),
  per_jar: L("/ jar", "/ जार", " / jar", "/ જાર", "/ जार"),
  advance: L("advance", "एडवांस", "credit balance", "એડવાન્સ", "अॅडव्हान्स"),
  pending_rs: L("pending paise", "पेंडिंग पैसे", "outstanding", "પેન્ડિંગ પૈસા", "पेंडिंग पैसे"),
  rate: L("Rate", "रेट", "Rate", "રેટ", "रेट"),
  dm_miss: L("Delivery man nahi mila", "डिलीवरी मैन नहीं मिला", "Associate not found", "ડિલિવરી મેન મળ્યો નહીં", "डिलिव्हरी मॅन सापडला नाही"),
  shop_gave: L("Shop pe dale", "शॉप पे डाले", "Delivered to shops", "શોપ પર આપ્યા", "शॉपवर दिले"),
  this_dm_count: L("Is delivery man ne {a} gine, system {b} kehta hai.", "इस डिलीवरी मैन ने {a} गिने, सिस्टम {b} कहता है।", "This associate counted {a}; the system expects {b}.", "આ ડિલિવરી મેને {a} ગણ્યા, સિસ્ટમ {b} કહે છે.", "या डिलिव्हरी मॅनने {a} मोजले, सिस्टम {b} म्हणतो."),
  date: L("Date", "डेट", "Date", "તારીખ", "डेट"),
  took_col: L("Leke", "लेके", "Loaded", "લઈને", "नेले"),
  gave_col: L("Dale", "डाले", "Delivered", "આપ્યા", "दिले"),
  cap_col: L("Cap", "कैप", "Cap", "કેપ", "कॅप"),
  broke_col: L("Toot", "टूट", "Broken", "તૂટ", "तुट"),
  cash_col: L("Rokda", "रोकड़ा", "Cash", "રોકડા", "रोकडा"),
  back_col: L("Wapas", "वापस", "Returned", "પાછા", "परत"),
  count_col: L("Gine", "गिने", "Counted", "ગણ્યા", "मोजले"),
  need_col: L("Chahiye", "चाहिए", "Expected", "જોઈએ", "हवे"),
  no_trip: L("Is period mein plant trip nahi.", "इस पीरियड में प्लांट ट्रिप नहीं।", "No plant trips in this period.", "આ પીરિયડમાં પ્લાન્ટ ટ્રિપ નથી.", "या काळात प्लांट ट्रिप नाही."),
  no_dm_month: L("Is mahine is delivery man ke customers nahi, ya delivery nahi.", "इस महीने इस डिलीवरी मैन के कस्टमर नहीं, या डिलीवरी नहीं।", "No customers or deliveries for this associate this month.", "આ મહિને આ ડિલિવરી મેનના કસ્ટમર નથી, કે ડિલિવરી નથી.", "या महिन्यात या डिलिव्हरी मॅनचे कस्टमर नाहीत, किंवा डिलिव्हरी नाही."),
  register: L("register", "रजिस्टर", "register", "રજિસ્ટર", "रजिस्टर"),
  reg_help: L("Upar = kitne jar dale · Neeche = kitne khali uthaye · Side mein 1 se {n} tarikh", "ऊपर = कितने जार डाले · नीचे = कितने खाली उठाए · साइड में 1 से {n} तारीख", "Top = delivered · Bottom = empties · Columns 1–{n}", "ઉપર = કેટલા જાર આપ્યા · નીચે = કેટલા ખાલી ઉઠાવ્યા · બાજુમાં 1 થી {n} તારીખ", "वर = किती जार दिले · खाली = किती रिकामी उचलली · बाजूला 1 ते {n} तारीख"),
  tot_jar: L("Total jar", "टोटल जार", "Total jars", "ટોટલ જાર", "टोटल जार"),
  tot_empty: L("Total khali", "टोटल खाली", "Total empties", "ટોટલ ખાલી", "टोटल रिकामी"),
  total: L("Total", "टोटल", "Total", "ટોટલ", "टोटल"),
  time: L("Time", "टाइम", "Time", "ટાઈમ", "टाइम"),
  empty_col: L("Khali", "खाली", "Empty", "ખાલી", "रिकामी"),
  no_done_del: L("Is period mein koi complete delivery nahi.", "इस पीरियड में कोई कंप्लीट डिलीवरी नहीं।", "No completed deliveries in this period.", "આ પીરિયડમાં કોઈ કમ્પ્લીટ ડિલિવરી નથી.", "या काळात कोणती कंप्लीट डिलिव्हरी नाही."),
  print: L("Print", "प्रिंट", "Print", "પ્રિન્ટ", "प्रिंट"),
  save_img: L("Save image", "सेव इमेज", "Save image", "સેવ ઇમેજ", "सेव्ह इमेज"),
  net_udhari: L("Net udhari", "नेट उधारी", "Net outstanding", "નેટ ઉધારી", "नेट उधारी"),
  collected_pct: L("Kul bill se kitna aaya", "टोटल बिल से कितना आया", "Collected against billed", "ટોટલ બિલમાંથી કેટલું આવ્યું", "टोटल बिलमधून किती आले"),
  got_billed: L("Aaya ₹ {a} · Bill ₹ {b}", "आया ₹ {a} · बिल ₹ {b}", "Received ₹ {a} · Billed ₹ {b}", "આવ્યા ₹ {a} · બિલ ₹ {b}", "आले ₹ {a} · बिल ₹ {b}"),
  assets_h: L("Assets · jo hamare hain", "असेट्स · जो हमारे हैं", "Assets", "એસેટ્સ · જે આપણા છે", "अॅसेट्स · जे आपले आहेत"),
  cust_udhari: L("Customer udhari (pending paise)", "कस्टमर उधारी (पेंडिंग पैसे)", "Receivables (outstanding)", "કસ્ટમર ઉધારી (પેન્ડિંગ પૈસા)", "कस्टमर उधारी (पेंडिंग पैसे)"),
  cash_out: L("Cash / bank (app mein nahi)", "कैश / बैंक (ऐप में नहीं)", "Cash / bank (not in app)", "કેશ / બેંક (એપમાં નથી)", "कॅश / बँक (अॅपमध्ये नाही)"),
  tot_assets: L("Total assets", "टोटल असेट्स", "Total assets", "ટોટલ એસેટ્સ", "टोटल अॅसेट्स"),
  liab_h: L("Liabilities + capital", "लॉयबिलिटी + कैपिटल", "Liabilities + capital", "લાયબિલિટી + કેપિટલ", "लायबिलिटी + कॅपिटल"),
  cust_adv: L("Customer advance", "कस्टमर एडवांस", "Customer advances", "કસ્ટમર એડવાન્સ", "कस्टमर अॅडव्हान्स"),
  cap_udhari: L("Capital / net udhari", "कैपिटल / नेट उधारी", "Capital / net outstanding", "કેપિટલ / નેટ ઉધારી", "कॅपिटल / नेट उधारी"),
  books_ok: L("Books tally · Assets = Liabilities + Capital", "बुक्स टैली · असेट्स = लॉयबिलिटी + कैपिटल", "Books tally · Assets = Liabilities + Capital", "બુક્સ ટેલી · એસેટ્સ = લાયબિલિટી + કેપિટલ", "बुक्स टॅली · अॅसेट्स = लायबिलिटी + कॅपिटल"),
  check_n: L("Check numbers", "नंबर चेक करो", "Review the figures", "નંબર ચેક કરો", "नंबर चेक करा"),
  period_acc: L("Period account", "पीरियड अकाउंट", "Period account", "પીરિયડ અકાઉન્ટ", "पीरियड अकाउंट"),
  credit_sale: L("Is period mein dale (credit sale)", "इस पीरियड में डाले (क्रेडिट सेल)", "Credit sales this period", "આ પીરિયડમાં આપ્યા (ક્રેડિટ સેલ)", "या काळात दिले (क्रेडिट सेल)"),
  period_pay: L("Is period mein payment aaya", "इस पीरियड में पेमेंट आया", "Receipts this period", "આ પીરિયડમાં પેમેન્ટ આવ્યું", "या काळात पेमेंट आले"),
  all_pending_m: L("Abhi pending paise (sab customers)", "अभी पेंडिंग पैसे (सब कस्टमर)", "Outstanding (all customers)", "હાલ પેન્ડિંગ પૈસા (બધા કસ્ટમર)", "आता पेंडिंग पैसे (सगळे कस्टमर)"),
  jar_stmt: L("Jar statement", "जार स्टेटमेंट", "Jar statement", "જાર સ્ટેટમેન્ટ", "जार स्टेटमेंट"),
  plant_went: L("Plant se gaye", "प्लांट से गए", "Left plant", "પ્લાન્ટથી ગયા", "प्लांटहून गेले"),
  shop_empty_s: L("Shop se khali", "शॉप से खाली", "Empties from shops", "શોપથી ખાલી", "शॉपवरून रिकामी"),
  period_pays: L("Is period ke payments", "इस पीरियड के पेमेंट्स", "Receipts this period", "આ પીરિયડના પેમેન્ટ્સ", "या काळातील पेमेंट्स"),
  udhari_list: L("Udhari list", "उधारी लिस्ट", "Receivables", "ઉધારી લિસ્ટ", "उधारी लिस्ट"),
  pending_rupee: L("Pending ₹", "पेंडिंग ₹", "Outstanding ₹", "પેન્ડિંગ ₹", "पेंडिंग ₹"),
  udhari_rupee: L("Udhari ₹", "उधारी ₹", "Outstanding ₹", "ઉધારી ₹", "उधारी ₹"),
  market_jar: L("Market jar", "मार्केट जार", "Market jars", "માર્કેટ જાર", "मार्केट जार"),
  dm_wise: L("Delivery man wise", "डिलीवरी मैन वाइज", "By associate", "ડિલિવરી મેન વાઈઝ", "डिलिव्हरी मॅन वाईज"),
  no_dues: L("Kisi customer ke pending paise nahi — ya rate / payment set nahi.", "किसी कस्टमर के पेंडिंग पैसे नहीं — या रेट / पेमेंट सेट नहीं।", "No outstanding dues — or rate / payment is not set.", "કોઈ કસ્ટમરના પેન્ડિંગ પૈસા નથી — કે રેટ / પેમેન્ટ સેટ નથી.", "कोणत्या कस्टमरचे पेंडिंग पैसे नाहीत — किंवा रेट / पेमेंट सेट नाही."),
  eoe: L("E. & O.E. · Rate aaj ka. Purana bill rate change se badal sakta hai.", "E. & O.E. · रेट आज का। पुराना बिल रेट चेंज से बदल सकता है।", "E. & O.E. · Rate as of today. Earlier invoices may change if the rate is updated.", "E. & O.E. · રેટ આજનો. જૂનું બિલ રેટ બદલાય તો બદલાઈ શકે.", "E. & O.E. · रेट आजचा. जुने बिल रेट बदलल्यास बदलू शकते."),
  prepared: L("Prepared", "तैयार", "Prepared", "તૈયાર", "तयार"),
  cust_miss: L("Customer nahi mila", "कस्टमर नहीं मिला", "Customer not found", "કસ્ટમર મળ્યો નહીં", "कस्टमर सापडला नाही"),
  bill: L("Bill", "बिल", "Invoice", "બિલ", "बिल"),
  no_rate: L("Is customer ka rate nahi hai. Customer / rate dabao, ₹ likho, phir bill amount aayega.", "इस कस्टमर का रेट नहीं है। कस्टमर / रेट दबाओ, ₹ लिखो, फिर बिल अमाउंट आएगा।", "This customer has no rate. Open Customer / rate, enter ₹, then the invoice total will appear.", "આ કસ્ટમરનો રેટ નથી. કસ્ટમર / રેટ દબાવો, ₹ લખો, પછી બિલ આવશે.", "या कस्टमरचा रेट नाही. कस्टमर / रेट दाबा, ₹ लिहा, मग बिल येईल."),
  cust_rate: L("Customer / rate", "कस्टमर / रेट", "Customer / rate", "કસ્ટમર / રેટ", "कस्टमर / रेट"),
  route_l: L("Route", "रूट", "Route", "રૂટ", "रूट"),
  no_del: L("Is period mein koi delivery nahi.", "इस पीरियड में कोई डिलीवरी नहीं।", "No deliveries in this period.", "આ પીરિયડમાં કોઈ ડિલિવરી નથી.", "या काळात कोणती डिलिव्हरी नाही."),
  pay_h: L("Payment / pichle pending paise", "पेमेंट / पिछले पेंडिंग पैसे", "Receipts / outstanding", "પેમેન્ટ / પાછલા પેન્ડિંગ પૈસા", "पेमेंट / मागील पेंडिंग पैसे"),
  tot_bill: L("Kul bill (sab jar × rate)", "टोटल बिल (सब जार × रेट)", "Total billed (jars × rate)", "ટોટલ બિલ (બધા જાર × રેટ)", "टोटल बिल (सगळे जार × रेट)"),
  tot_got: L("Kul paise aaye", "टोटल पैसे आए", "Total received", "ટોટલ પૈસા આવ્યા", "टोटल पैसे आले"),
  old_pending: L("Pichle pending paise", "पिछले पेंडिंग पैसे", "Outstanding dues", "પાછલા પેન્ડિંગ પૈસા", "मागील पेंडिंग पैसे"),
  period_line: L("Is period: {j} jar × ₹ {r} = ₹ {a}", "इस पीरियड: {j} जार × ₹ {r} = ₹ {a}", "This period: {j} jars × ₹ {r} = ₹ {a}", "આ પીરિયડ: {j} જાર × ₹ {r} = ₹ {a}", "या काळात: {j} जार × ₹ {r} = ₹ {a}"),
  amt_in: L("Kitne paise aaye (₹)", "कितने पैसे आए (₹)", "Amount received (₹)", "કેટલા પૈસા આવ્યા (₹)", "किती पैसे आले (₹)"),
  for_month: L("Konse mahine ke", "कौनसे महीने के", "For month", "કયા મહિનાના", "कोणत्या महिन्याचे"),
  pay_save: L("Payment save", "पेमेंट सेव", "Save receipt", "પેમેન્ટ સેવ", "पेमेंट सेव्ह"),
  paise: L("Paise", "पैसे", "Amount", "પૈસા", "पैसे"),
  remove: L("Hatao", "हटाओ", "Remove", "હટાવો", "काढा"),
  no_pay: L("Abhi koi payment nahi likha.", "अभी कोई पेमेंट नहीं लिखा।", "No receipts recorded yet.", "હજુ કોઈ પેમેન્ટ લખ્યું નથી.", "अजून कोणते पेमेंट लिहिले नाही."),
  cust_name: L("Customer ka naam", "कस्टमर का नाम", "Customer name", "કસ્ટમરનું નામ", "कस्टमरचे नाव"),
  place_opt: L("Place / area (optional)", "प्लेस / एरिया (ऑप्शनल)", "Area (optional)", "પ્લેસ / એરિયા (ઓપ્શનલ)", "प्लेस / एरिया (ऑप्शनल)"),
  place_ph: L("Jaise MIDC, Ramanand Nagar — khali chhod sakte ho", "जैसे MIDC, रामानंद नगर — खाली छोड़ सकते हो", "e.g. MIDC, Ramanand Nagar", "જેમ કે MIDC, રામાનંદ નગર — ખાલી મૂકી શકો", "जसे MIDC, रामानंद नगर — रिकामे ठेवू शकता"),
  jar_rate: L("Jar ka rate (₹)", "जार का रेट (₹)", "Rate per jar (₹)", "જારનો રેટ (₹)", "जारचा रेट (₹)"),
  close: L("Band", "बंद", "Cancel", "બંધ", "बंद"),
  save: L("Save", "सेव", "Save", "સેવ", "सेव्ह"),
  new_cust_t: L("Naya customer", "नया कस्टमर", "New customer", "નવો કસ્ટમર", "नवा कस्टमर"),
  cust_edit: L("Customer edit", "कस्टमर एडिट", "Edit customer", "કસ્ટમર એડિટ", "कस्टमर एडिट"),
  new_dm: L("Naya Delivery man", "नया डिलीवरी मैन", "New delivery associate", "નવો ડિલિવરી મેન", "नवा डिलिव्हरी मॅन"),
  name: L("Naam", "नाम", "Name", "નામ", "नाव"),
  key_hint: L("Save ke baad key milegi. WhatsApp pe bhej dena.", "सेव के बाद की मिलेगी। व्हाट्सऐप पे भेज देना।", "A key is created on save. Share it on WhatsApp.", "સેવ પછી કી મળશે. વોટ્સએપ પર મોકલી દેજો.", "सेव्ह नंतर की मिळेल. WhatsApp वर पाठवा."),
  user_min: L("Kam se kam 3 letters", "कम से कम 3 लेटर्स", "At least 3 characters", "ઓછામાં ઓછા 3 અક્ષર", "किमान 3 अक्षरे"),
  checking: L("Check...", "चेक...", "Checking…", "ચેક...", "चेक..."),
  taken: L("@{u} le liya gaya", "@{u} ले लिया गया", "@{u} is taken", "@{u} લઈ લેવાયું", "@{u} घेतले गेले"),
  free: L("@{u} available", "@{u} अवेलेबल", "@{u} is available", "@{u} અવેલેબલ", "@{u} उपलब्ध"),
  pass_bad: L("Password match nahi karta.", "पासवर्ड मैच नहीं करता।", "Passwords do not match.", "પાસવર્ડ મેચ નથી કરતો.", "पासवर्ड मॅच होत नाही."),
  key_copy: L("Key copy ho gayi: {k}", "की कॉपी हो गई: {k}", "Key copied: {k}", "કી કોપી થઈ: {k}", "की कॉपी झाली: {k}"),
  login_key_is: L("Login key: {k}", "लॉगिन की: {k}", "Access key: {k}", "લોગિન કી: {k}", "लॉगिन की: {k}"),
  give_key: L("Yeh key Delivery man ko do. Company username alag se.", "ये की डिलीवरी मैन को दो। कंपनी यूजरनेम अलग से।", "Share this key with the delivery associate. Company username is separate.", "આ કી ડિલિવરી મેનને આપો. કંપની યુઝરનેમ અલગથી.", "ही की डिलिव्हरी मॅनला द्या. कंपनी युजरनेम वेगळे."),
  del_cust: L("Is customer ko hataayein?", "इस कस्टमर को हटाएं?", "Remove this customer?", "આ કસ્ટમરને હટાવીએ?", "हा कस्टमर काढायचा?"),
  del_pay: L("Yeh payment hataayein?", "ये पेमेंट हटाएं?", "Remove this receipt?", "આ પેમેન્ટ હટાવીએ?", "हे पेमेंट काढायचे?"),
  err_role: L("Delivery man login se Plant dashboard nahi khulega. Logout karke Plant se login karo.", "डिलीवरी मैन लॉगिन से प्लांट डैशबोर्ड नहीं खुलेगा। लॉगआउट करके प्लांट से लॉगिन करो।", "A delivery sign-in cannot open the plant dashboard. Sign out, then sign in as plant.", "ડિલિવરી મેન લોગિનથી પ્લાન્ટ ડેશબોર્ડ નહીં ખૂલે. લૉગઆઉટ કરીને પ્લાન્ટથી લોગિન કરો.", "डिलिव्हरी मॅन लॉगिनने प्लांट डॅशबोर्ड उघडणार नाही. लॉगआउट करून प्लांटने लॉगिन करा."),
  err_net: L("Supabase connect nahi hua", "सुपाबेस कनेक्ट नहीं हुआ", "Could not reach the server", "સુપાબેઝ કનેક્ટ ન થયું", "सुपाबेस कनेक्ट झाले नाही"),
  err_amt: L("Kitne paise aaye, woh likho.", "कितने पैसे आए, वो लिखो।", "Enter the amount received.", "કેટલા પૈસા આવ્યા તે લખો.", "किती पैसे आले ते लिहा."),
  err_mon: L("Konse mahine ke paise hain, woh chuno.", "कौनसे महीने के पैसे हैं, वो चुनो।", "Select the month this receipt is for.", "કયા મહિનાના પૈસા છે તે પસંદ કરો.", "कोणत्या महिन्याचे पैसे आहेत ते निवडा."),
  err_own: L("Pehle owner login karo.", "पहले ओनर लॉगिन करो।", "Sign in as plant first.", "પહેલા ઓનર લોગિન કરો.", "आधी ओनर लॉगिन करा."),
  err_sql: L("Security SQL nahi chali. sanjay_aqua_full.sql poora Run karo, phir Ctrl+Shift+R.", "सिक्योरिटी SQL नहीं चली। sanjay_aqua_full.sql पूरा Run करो, फिर Ctrl+Shift+R.", "Security SQL has not been applied. Run sanjay_aqua_full.sql, then refresh.", "સિક્યોરિટી SQL ન ચાલી. sanjay_aqua_full.sql પૂરું Run કરો, પછી Ctrl+Shift+R.", "सिक्युरिटी SQL चालली नाही. sanjay_aqua_full.sql पूर्ण Run करा, मग Ctrl+Shift+R."),
  err_sess: L("Session khatam ya SQL lock nahi chala. sanjay_aqua_full.sql Run karo, phir login karo.", "सेशन खतम या SQL लॉक नहीं चला। sanjay_aqua_full.sql Run करो, फिर लॉगिन करो।", "Session expired, or security SQL is not applied. Run sanjay_aqua_full.sql, then sign in.", "સેશન ખતમ કે SQL લોક ન ચાલ્યું. sanjay_aqua_full.sql Run કરો, પછી લોગિન કરો.", "सेशन संपले किंवा SQL लॉक चालले नाही. sanjay_aqua_full.sql Run करा, मग लॉगिन करा."),
  err_fn: L("Login SQL nahi chali. Supabase SQL Editor mein sanjay_aqua_full.sql poora Run karo, phir Ctrl+Shift+R.", "लॉगिन SQL नहीं चली। सुपाबेस SQL Editor में sanjay_aqua_full.sql पूरा Run करो, फिर Ctrl+Shift+R.", "Login SQL is missing. Run sanjay_aqua_full.sql in the SQL editor, then refresh.", "લોગિન SQL ન ચાલી. સુપાબેઝ SQL Editorમાં sanjay_aqua_full.sql પૂરું Run કરો, પછી Ctrl+Shift+R.", "लॉगिन SQL चालली नाही. सुपाबेस SQL Editor मध्ये sanjay_aqua_full.sql पूर्ण Run करा, मग Ctrl+Shift+R."),
  err_dev: L("Device save nahi hua", "डिवाइस सेव नहीं हुआ", "Could not save device", "ડિવાઇસ સેવ ન થયું", "डिव्हाइस सेव्ह झाले नाही"),
  err_csave: L("Customer save nahi hua", "कस्टमर सेव नहीं हुआ", "Could not save customer", "કસ્ટમર સેવ ન થયું", "कस्टमर सेव्ह झाले नाही"),
  err_rsave: L("Rate save nahi hua. Supabase SQL Editor mein sanjay_aqua_full.sql poora Run karo, phir Ctrl+Shift+R.", "रेट सेव नहीं हुआ। सुपाबेस SQL Editor में sanjay_aqua_full.sql पूरा Run करो, फिर Ctrl+Shift+R.", "Could not save the rate. Run sanjay_aqua_full.sql, then refresh.", "રેટ સેવ ન થયો. સુપાબેઝ SQL Editorમાં sanjay_aqua_full.sql પૂરું Run કરો, પછી Ctrl+Shift+R.", "रेट सेव्ह झाला नाही. सुपाबेस SQL Editor मध्ये sanjay_aqua_full.sql पूर्ण Run करा, मग Ctrl+Shift+R."),
  err_cupd: L("Customer update nahi hua", "कस्टमर अपडेट नहीं हुआ", "Could not update customer", "કસ્ટમર અપડેટ ન થયું", "कस्टमर अपडेट झाले नाही"),
  err_psave: L("Payment save nahi hua. Supabase SQL Editor mein sanjay_aqua_full.sql poora Run karo, phir Ctrl+Shift+R.", "पेमेंट सेव नहीं हुआ। सुपाबेस SQL Editor में sanjay_aqua_full.sql पूरा Run करो, फिर Ctrl+Shift+R.", "Could not save the receipt. Run sanjay_aqua_full.sql, then refresh.", "પેમેન્ટ સેવ ન થયું. સુપાબેઝ SQL Editorમાં sanjay_aqua_full.sql પૂરું Run કરો, પછી Ctrl+Shift+R.", "पेमेंट सेव्ह झाले नाही. सुपाबेस SQL Editor मध्ये sanjay_aqua_full.sql पूर्ण Run करा, मग Ctrl+Shift+R."),
  err_tsave: L("Trip save nahi hua", "ट्रिप सेव नहीं हुआ", "Could not save the trip", "ટ્રિપ સેવ ન થઈ", "ट्रिप सेव्ह झाली नाही"),
  error: L("Error", "एरर", "Error", "એરર", "एरर"),
  wait_n: L("Ruko, {n} second baad try karo.", "रुको, {n} सेकंड बाद ट्राय करो।", "Please wait {n} seconds, then try again.", "રુકો, {n} સેકન્ડ પછી ટ્રાય કરો.", "थांबा, {n} सेकंदांनंतर ट्राय करा."),
  lock_n: L("4 galat try. {n} second baad try karo.", "4 गलत ट्राय। {n} सेकंड बाद ट्राय करो।", "4 incorrect attempts. Try again in {n} seconds.", "4 ખોટા ટ્રાય. {n} સેકન્ડ પછી ટ્રાય કરો.", "4 चुकीचे ट्राय. {n} सेकंदांनंतर ट्राय करा."),
  err_ushort: L("Username kam se kam 3 letters", "यूजरनेम कम से कम 3 लेटर्स", "Username must be at least 3 characters", "યુઝરનેમ ઓછામાં ઓછા 3 અક્ષર", "युजरनेम किमान 3 अक्षरे"),
  err_firm: L("Firm ka naam likho", "फर्म का नाम लिखो", "Enter the company name", "ફર્મનું નામ લખો", "फर्मचे नाव लिहा"),
  err_pshort: L("Password kam se kam 6 letters", "पासवर्ड कम से कम 6 लेटर्स", "Password must be at least 6 characters", "પાસવર્ડ ઓછામાં ઓછા 6 અક્ષર", "पासवर्ड किमान 6 अक्षरे"),
  err_taken: L("Username already taken", "यूजरनेम पहले से लिया गया", "That username is taken", "યુઝરનેમ પહેલેથી લેવાયું", "युजरनेम आधीच घेतले आहे"),
  err_bad: L("Username ya password galat", "यूजरनेम या पासवर्ड गलत", "Incorrect username or password", "યુઝરનેમ કે પાસવર્ડ ખોટો", "युजरनेम किंवा पासवर्ड चुकीचा"),
  err_key: L("Company username ya key galat", "कंपनी यूजरनेम या की गलत", "Incorrect company username or key", "કંપની યુઝરનેમ કે કી ખોટી", "कंपनी युजरनेम किंवा की चुकीची"),
  err_send: L("Session khatam", "सेशन खतम", "Session expired", "સેશન ખતમ", "सेशन संपले"),
  err_dgalat: L("Device galat", "डिवाइस गलत", "Device mismatch", "ડિવાઇસ ખોટું", "डिव्हाइस चुकीचे"),
  user_ph: L("jaise sanjayaqua", "जैसे sanjayaqua", "e.g. sanjayaqua", "જેમ કે sanjayaqua", "जसे sanjayaqua"),
  amt_ph: L("Jaise 1500", "जैसे 1500", "e.g. 1500", "જેમ કે 1500", "जसे 1500"),
  rate_ph: L("Jaise 30", "जैसे 30", "e.g. 30", "જેમ કે 30", "जसे 30"),
  jar: L("jar", "जार", "jars", "જાર", "जार"),
  cust_n: L("{n} customers", "{n} कस्टमर्स", "{n} customers", "{n} કસ્ટમર્સ", "{n} कस्टमर्स"),
  as_on: L("As on {d} · {l}", "As on {d} · {l}", "As on {d} · {l}", "As on {d} · {l}", "As on {d} · {l}"),
};

const dict = { roman: {}, hi: {}, en: {}, gu: {}, mr: {} };
for (const [k, v] of Object.entries(rows)) {
  dict.roman[k] = v.roman;
  dict.hi[k] = v.hi;
  dict.en[k] = v.en;
  dict.gu[k] = v.gu;
  dict.mr[k] = v.mr;
}

function readLang() {
  try {
    const v = localStorage.getItem(KEY);
    if (LANGS.some((l) => l.id === v)) return v;
  } catch {}
  return "roman";
}

let current = readLang();

export function getLang() {
  return current;
}

export function htmlLang() {
  return { roman: "hi", hi: "hi", en: "en", gu: "gu", mr: "mr" }[current] || "hi";
}

export function dateLocale() {
  return { roman: "en-IN", hi: "hi-IN", en: "en-IN", gu: "gu-IN", mr: "mr-IN" }[current] || "en-IN";
}

export function speakLocale() {
  return { roman: "hi-IN", hi: "hi-IN", en: "en-IN", gu: "gu-IN", mr: "mr-IN" }[current] || "hi-IN";
}

export function applyLang() {
  try { document.documentElement.lang = htmlLang(); } catch {}
  try { document.documentElement.dataset.lang = current; } catch {}
}

export function setLang(id) {
  if (!LANGS.some((l) => l.id === id)) return;
  current = id;
  try { localStorage.setItem(KEY, id); } catch {}
  applyLang();
}

export function t(key, vars) {
  const pack = dict[current] || dict.roman;
  let s = pack[key] ?? dict.roman[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  }
  return s;
}

export function serverMsg(raw) {
  const m = String(raw || "").replace(/^.*ERROR:\s*/i, "").split("\n")[0].trim();
  let hit = m.match(/^Ruko,\s*(\d+)\s*second baad try karo\.?$/i);
  if (hit) return t("wait_n", { n: hit[1] });
  hit = m.match(/^4 galat try\.\s*(\d+)\s*second baad try karo\.?$/i);
  if (hit) return t("lock_n", { n: hit[1] });
  const map = {
    "Username kam se kam 3 letters": "err_ushort",
    "Firm ka naam likho": "err_firm",
    "Password kam se kam 6 letters": "err_pshort",
    "Username already taken": "err_taken",
    "Username ya password galat": "err_bad",
    "Company username ya key galat": "err_key",
    "Session khatam": "err_send",
    "Device galat": "err_dgalat",
  };
  if (map[m]) return t(map[m]);
  return m;
}

export function langPicker(kind = "full") {
  const opts = LANGS.map((l) => `<option value="${l.id}" ${l.id === current ? "selected" : ""}>${l.label}</option>`).join("");
  if (kind === "mini") {
    return `<select class="lang-mini" data-act="lang" aria-label="${t("language")}">${opts}</select>`;
  }
  return `
    <label class="lang-pick">
      <span>${t("language")}</span>
      <select data-act="lang">${opts}</select>
    </label>
  `;
}

applyLang();
