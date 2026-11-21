import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { SAMPLE_PROPERTIES } from '../../data/sampleProperties';

const SUB_LOCALITIES = {
  'Salt Lake': [
    'Sector V (IT Hub)',
    'Sector I',
    'Sector II',
    'Sector III',
    'Karunamoyee',
    'City Centre 1',
    'Salt Lake Stadium',
    'Any area in Salt Lake',
  ],
  'Garia': [
    'Garia Station',
    'Mahamayatala',
    'Kavi Nazrul Metro',
    'Garia More',
    'Kamalgazi',
    'Patuli / Garia',
    'Any area in Garia',
  ],
  'New Town': [
    'Action Area 1',
    'Action Area 2',
    'Action Area 3',
    'Candor TechSpace',
    'Eco Park',
    'Any area in New Town',
  ],
  'Kolkata': [
    'Salt Lake',
    'New Town',
    'Garia',
    'Ballygunge',
    'Jadavpur',
    'Behala',
    'Park Street',
    'Dum Dum',
    'Tollygunge',
    'Any area in Kolkata',
  ],
  'Ballygunge': [
    'Ballygunge Phari',
    'Gariahat',
    'Southern Avenue',
    'Hazra / Ballygunge',
    'Any area in Ballygunge',
  ],
  'Jadavpur': [
    'Jadavpur University / 8B',
    'Sulekha',
    'Santoshpur',
    'Any area in Jadavpur',
  ],
  'Behala': [
    'Behala Chowrasta',
    'Taratala',
    'Parnasree',
    'Thakurpukur',
    'Any area in Behala',
  ],
  'Dum Dum': [
    'Dum Dum Metro',
    'Dum Dum Cantonment',
    'Nagerbazar',
    'Airport Gate',
    'Any area in Dum Dum',
  ],
  'Howrah': [
    'Howrah Station',
    'Shibpur',
    'Mandirtala',
    'Salkia',
    'Any area in Howrah',
  ],
  'Tollygunge': [
    'Mahanayak Uttam Kumar Metro',
    'Ranikuthi',
    'Netaji Nagar',
    'Any area in Tollygunge',
  ],
  'Kasba': [
    'Kasba New Market',
    'Ruby Crossing',
    'Bosepukur',
    'Any area in Kasba',
  ],
  'Rajarhat': [
    'Chinar Park',
    'City Centre 2',
    'Rajarhat Chowmatha',
    'Any area in Rajarhat',
  ],
};

export default function HomeMateChatbot({ onOpenSearchFilters, properties = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentOptions, setCurrentOptions] = useState(null);
  const [showBudgetSlider, setShowBudgetSlider] = useState(false);
  const [budgetVal, setBudgetVal] = useState(15000);
  const [matchedResults, setMatchedResults] = useState([]);
  const [inputText, setInputText] = useState('');
  const [busy, setBusy] = useState(false);

  const bodyRef = useRef(null);
  const navigate = useNavigate();

  // Assistant questionnaire state
  const stateRef = useRef({
    location: '',
    sublocation: '',
    person: '',
    gender: '',
    type: '',
    subtype: '',
    bathroom: '',
    kitchen: '',
    budget: 15000,
    food: '',
    step: 'location',
  });

  // Scroll to bottom whenever messages or options change
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, currentOptions, showBudgetSlider, matchedResults]);

  const addBotMessage = (text) => {
    setMessages((prev) => [...prev, { sender: 'bot', text, id: Date.now() + Math.random() }]);
  };

  const addUserMessage = (text) => {
    setMessages((prev) => [...prev, { sender: 'user', text, id: Date.now() + Math.random() }]);
  };

  const allListings = properties.length > 0 ? properties : SAMPLE_PROPERTIES;

  const matchProperties = useCallback(() => {
    const s = stateRef.current;
    const scored = allListings
      .map((item, idx) => {
        let score = 0;
        const type = (item.type || item.category || '').toLowerCase();
        const loc = (item.location || item.city || '').toLowerCase();
        const text = (item.title + ' ' + (item.keywords || '') + ' ' + (item.description || '') + ' ' + (item.location || '')).toLowerCase();
        const bath = (item.bathroom || item.bathroom_type || '').toLowerCase();
        const kitchen = (item.kitchen || '').toLowerCase();
        const tenant = (item.tenant || item.allowed_tenants || '').toLowerCase();

        if (s.type && type.includes(s.type.toLowerCase())) score += 35;
        if (s.location) {
          const locLower = s.location.toLowerCase();
          if (locLower === 'kolkata' || locLower.includes('any')) {
            score += 20;
          } else if (loc.includes(locLower) || text.includes(locLower)) {
            score += 30;
          }
        }
        if (s.sublocation && !s.sublocation.toLowerCase().startsWith('any')) {
          const cleanSub = s.sublocation.toLowerCase().replace(/\s*\(.*?\)/, '').trim();
          if (text.includes(cleanSub) || loc.includes(cleanSub)) {
            score += 35;
          }
        }
        if (s.bathroom && s.bathroom !== 'Any' && bath.includes(s.bathroom.toLowerCase())) score += 10;
        if (s.kitchen && s.kitchen !== 'Any' && kitchen.includes(s.kitchen.toLowerCase())) score += 10;
        if (s.person && tenant.includes(s.person.toLowerCase())) score += 10;
        if (s.subtype && text.includes(s.subtype.toLowerCase())) score += 10;

        const price = Number(item.price || item.monthly_rent || 0);
        if (price > 0 && price <= s.budget) score += 20;

        return { item, idx, score, price };
      })
      .filter((x) => x.price <= s.budget)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    addBotMessage('Here are your best matching properties, ranked by your requirements, budget and location:');

    if (scored.length === 0) {
      addBotMessage('No exact match found under this budget. Try increasing your budget or changing your preferred location.');
      setCurrentOptions({
        items: ['🔄 Increase budget', '📍 Change location', '🔎 Open Advanced Search'],
        callback: (choice) => {
          if (choice === '🔄 Increase budget') {
            setShowBudgetSlider(true);
          } else if (choice === '📍 Change location') {
            stateRef.current.step = 'location';
            askLocation();
          } else if (choice === '🔎 Open Advanced Search') {
            setIsOpen(false);
            onOpenSearchFilters?.();
          }
        },
      });
      return;
    }

    setMatchedResults(scored.map((s) => s.item));

    setCurrentOptions({
      items: ['Search again', '🔎 Advanced Search'],
      callback: (choice) => {
        if (choice === 'Search again') {
          startDialogue();
        } else {
          setIsOpen(false);
          onOpenSearchFilters?.();
        }
      },
    });
  }, [allListings, onOpenSearchFilters]);

  const askBudget = () => {
    stateRef.current.step = 'budget';
    addBotMessage('Set your maximum monthly rent.');
    setShowBudgetSlider(true);
    setCurrentOptions({
      items: ['Under ₹8,000', 'Under ₹12,000', 'Under ₹18,000', 'Under ₹25,000'],
      callback: (bStr) => {
        const num = Number(bStr.replace(/\D/g, '')) || 15000;
        setBudgetVal(num);
        stateRef.current.budget = num;
        setShowBudgetSlider(false);
        addUserMessage(`Budget: up to ₹${num.toLocaleString('en-IN')}`);
        matchProperties();
      },
    });
  };

  const askCommonQuestions = () => {
    stateRef.current.step = 'bathroom';
    addBotMessage('What bathroom do you need?');
    setCurrentOptions({
      items: ['Private', 'Common', 'Any'],
      callback: (bath) => {
        stateRef.current.bathroom = bath;
        stateRef.current.step = 'kitchen';
        addUserMessage(bath);
        addBotMessage('Do you need a kitchen?');
        setCurrentOptions({
          items: ['Need', "Don't need", 'Any'],
          callback: (kit) => {
            stateRef.current.kitchen = kit;
            stateRef.current.step = 'budget';
            addUserMessage(kit);
            askBudget();
          },
        });
      },
    });
  };

  const askTypeSpecifics = () => {
    const s = stateRef.current;
    if (s.type === 'PG') {
      s.step = 'subtype';
      addBotMessage('What type of PG do you want?');
      setCurrentOptions({
        items: ['Single room', 'Common room'],
        callback: (sub) => {
          s.subtype = sub;
          s.step = 'food';
          addUserMessage(sub);
          addBotMessage('Is food included?');
          setCurrentOptions({
            items: ['Yes — food included', 'No — food not included'],
            callback: (food) => {
              s.food = food;
              s.step = 'bathroom';
              addUserMessage(food);
              askCommonQuestions();
            },
          });
        },
      });
    } else if (s.type === 'Room') {
      s.step = 'subtype';
      addBotMessage('What type of room do you want?');
      setCurrentOptions({
        items: ['Single private room', 'Double private room', 'Common room', 'Family room'],
        callback: (sub) => {
          s.subtype = sub;
          s.step = 'bathroom';
          addUserMessage(sub);
          askCommonQuestions();
        },
      });
    } else {
      s.step = 'subtype';
      addBotMessage('Which flat size do you want?');
      setCurrentOptions({
        items: ['1 BHK', '2 BHK', '3 BHK'],
        callback: (sub) => {
          s.subtype = sub;
          s.step = 'bathroom';
          addUserMessage(sub);
          askCommonQuestions();
        },
      });
    }
  };

  const askType = () => {
    stateRef.current.step = 'type';
    addBotMessage('What type of rental do you need?');
    setCurrentOptions({
      items: ['PG', 'Room', 'Flat'],
      callback: (typ) => {
        stateRef.current.type = typ;
        addUserMessage(typ);
        askTypeSpecifics();
      },
    });
  };

  const askGender = () => {
    stateRef.current.step = 'gender';
    addBotMessage('Are you male or female?');
    setCurrentOptions({
      items: ['Male', 'Female'],
      callback: (gender) => {
        stateRef.current.gender = gender;
        addUserMessage(gender);
        askType();
      },
    });
  };

  const askPerson = () => {
    stateRef.current.step = 'person';
    addBotMessage('Are you a student, working person, or family member?');
    setCurrentOptions({
      items: ['Student', 'Working person', 'Family member'],
      callback: (person) => {
        stateRef.current.person = person;
        addUserMessage(person);
        askGender();
      },
    });
  };

  const handleSubLocationSelect = (sub, textToDisplay) => {
    stateRef.current.sublocation = sub;
    addUserMessage(textToDisplay || sub);
    askPerson();
  };

  const handleLocationSelect = (loc, textToDisplay) => {
    stateRef.current.location = loc;
    addUserMessage(textToDisplay || loc);

    const locLower = loc.toLowerCase().trim();

    // If user selected Kolkata city-wide
    if (locLower === 'kolkata' || locLower === 'kolkata (all areas)') {
      stateRef.current.step = 'sublocation';
      addBotMessage('Kolkata is a large city! Which popular zone or area do you prefer?');
      setCurrentOptions({
        items: SUB_LOCALITIES['Kolkata'],
        callback: (choice) => {
          if (choice === 'Any area in Kolkata') {
            stateRef.current.sublocation = 'Any';
            addUserMessage(choice);
            askPerson();
          } else {
            handleLocationSelect(choice);
          }
        },
      });
      return;
    }

    // Check if location has defined sub-localities (e.g. Salt Lake, Garia, New Town, etc.)
    const matchedKey = Object.keys(SUB_LOCALITIES).find(
      (k) => k.toLowerCase() === locLower
    );

    if (matchedKey && SUB_LOCALITIES[matchedKey]) {
      stateRef.current.step = 'sublocation';
      const prompt =
        matchedKey === 'Salt Lake'
          ? 'Salt Lake is a large area. Which sector or landmark do you prefer?'
          : matchedKey === 'Garia'
          ? 'Garia has multiple localities. Which area in Garia do you prefer?'
          : matchedKey === 'New Town'
          ? 'New Town has multiple Action Areas. Which part do you prefer?'
          : `Which area in ${matchedKey} do you prefer?`;

      addBotMessage(prompt);
      setCurrentOptions({
        items: SUB_LOCALITIES[matchedKey],
        callback: (sub) => {
          handleSubLocationSelect(sub);
        },
      });
      return;
    }

    // Otherwise no specific sub-localities, advance to askPerson
    stateRef.current.sublocation = 'Any';
    askPerson();
  };

  const askLocation = () => {
    stateRef.current.step = 'location';
    addBotMessage('Where do you want to rent?');
    setCurrentOptions({
      items: [
        'Kolkata',
        'Salt Lake',
        'New Town',
        'Garia',
        'Ballygunge',
        'Jadavpur',
        'Behala',
        'Dum Dum',
        'Park Street',
        'Rajarhat',
        'Howrah',
        'Tollygunge',
        'Kasba',
      ],
      callback: (loc) => {
        handleLocationSelect(loc);
      },
    });
  };

  const startDialogue = () => {
    setMessages([]);
    setMatchedResults([]);
    setShowBudgetSlider(false);
    stateRef.current = {
      location: '',
      sublocation: '',
      person: '',
      gender: '',
      type: '',
      subtype: '',
      bathroom: '',
      kitchen: '',
      budget: 15000,
      food: '',
      step: 'location',
    };
    addBotMessage("Hi! I'm HomeMate 👋 I'll help you find the right rental.");
    askLocation();
  };

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen && messages.length === 0) {
      startDialogue();
    }
  };

  const handleSendTyped = (e) => {
    if (e) e.preventDefault();
    const raw = inputText.trim();
    if (!raw) return;
    setInputText('');

    const q = raw.toLowerCase().trim();

    // 1. If budget slider is active and user typed a number
    if (stateRef.current.step === 'budget' || showBudgetSlider) {
      const nums = q.match(/(?:₹|rs\.?\s*)?(\d{3,6})/);
      if (nums) {
        const num = Number(nums[1]);
        stateRef.current.budget = num;
        setBudgetVal(num);
        setShowBudgetSlider(false);
        addUserMessage(raw);
        matchProperties();
        return;
      }
    }

    // 2. If there are active options on screen, check if user's typed input matches one of them
    if (currentOptions && currentOptions.items && currentOptions.callback) {
      const matched = currentOptions.items.find((item) => {
        const itemLower = item.toLowerCase();
        if (itemLower === q || q.includes(itemLower) || itemLower.includes(q)) return true;
        const clean = itemLower.replace(/\s*\(.*?\)/, '').trim();
        if (clean === q || q.includes(clean) || clean.includes(q)) return true;
        return false;
      });
      if (matched) {
        currentOptions.callback(matched);
        return;
      }
    }

    // 3. Step-specific intelligent matching
    const step = stateRef.current.step;

    if (step === 'location') {
      if (['kolkata', 'kplkata', 'kolkatta', 'calcutta', 'cal', 'kol'].some((k) => q.includes(k))) {
        handleLocationSelect('Kolkata', raw);
        return;
      }
      if (['salt lake', 'saltlake', 'solt lake', 'bidhannagar'].some((k) => q.includes(k))) {
        handleLocationSelect('Salt Lake', raw);
        return;
      }
      if (['garia', 'goria', 'gariya'].some((k) => q.includes(k))) {
        handleLocationSelect('Garia', raw);
        return;
      }
      if (['new town', 'newtown', 'action area'].some((k) => q.includes(k))) {
        handleLocationSelect('New Town', raw);
        return;
      }
      if (['dum dum', 'dumdum'].some((k) => q.includes(k))) {
        handleLocationSelect('Dum Dum', raw);
        return;
      }
      if (['ballygunge', 'ballygunj', 'gariahat'].some((k) => q.includes(k))) {
        handleLocationSelect('Ballygunge', raw);
        return;
      }
      if (['jadavpur', 'jadabpur'].some((k) => q.includes(k))) {
        handleLocationSelect('Jadavpur', raw);
        return;
      }
      if (['behala'].some((k) => q.includes(k))) {
        handleLocationSelect('Behala', raw);
        return;
      }
      if (['park street', 'parkstreet'].some((k) => q.includes(k))) {
        handleLocationSelect('Park Street', raw);
        return;
      }
      if (['howrah', 'haora'].some((k) => q.includes(k))) {
        handleLocationSelect('Howrah', raw);
        return;
      }
      if (['tollygunge', 'tolly'].some((k) => q.includes(k))) {
        handleLocationSelect('Tollygunge', raw);
        return;
      }
      if (['rajarhat'].some((k) => q.includes(k))) {
        handleLocationSelect('Rajarhat', raw);
        return;
      }
      if (['kasba'].some((k) => q.includes(k))) {
        handleLocationSelect('Kasba', raw);
        return;
      }
      // If user typed any other locality name
      handleLocationSelect(raw, raw);
      return;
    }

    if (step === 'sublocation') {
      handleSubLocationSelect(raw, raw);
      return;
    }

    if (step === 'person') {
      if (['student', 'study', 'college', 'school'].some((k) => q.includes(k))) {
        stateRef.current.person = 'Student';
        addUserMessage(raw);
        askGender();
        return;
      }
      if (['working', 'job', 'office', 'service', 'corporate', 'professional', 'bachelor'].some((k) => q.includes(k))) {
        stateRef.current.person = 'Working person';
        addUserMessage(raw);
        askGender();
        return;
      }
      if (['family', 'couple', 'parents', 'wife', 'husband', 'children'].some((k) => q.includes(k))) {
        stateRef.current.person = 'Family member';
        addUserMessage(raw);
        askGender();
        return;
      }
    }

    if (step === 'gender') {
      if (['female', 'girl', 'woman', 'lady', 'f'].some((k) => q === k || q.includes(k))) {
        stateRef.current.gender = 'Female';
        addUserMessage(raw);
        askType();
        return;
      }
      if (['male', 'boy', 'man', 'guy', 'gentleman', 'm'].some((k) => q === k || q.includes(k))) {
        stateRef.current.gender = 'Male';
        addUserMessage(raw);
        askType();
        return;
      }
    }

    if (step === 'type') {
      if (['flat', 'apartment'].some((k) => q.includes(k))) {
        stateRef.current.type = 'Flat';
        addUserMessage(raw);
        askTypeSpecifics();
        return;
      }
      if (['pg', 'paying guest', 'hostel'].some((k) => q.includes(k))) {
        stateRef.current.type = 'PG';
        addUserMessage(raw);
        askTypeSpecifics();
        return;
      }
      if (['room'].some((k) => q.includes(k))) {
        stateRef.current.type = 'Room';
        addUserMessage(raw);
        askTypeSpecifics();
        return;
      }
    }

    // 4. Free-form / compound NLP query parsing
    let parsedAny = false;
    addUserMessage(raw);

    const nums = q.match(/(?:₹|rs\.?\s*)?(\d{3,6})/);
    if (nums) {
      stateRef.current.budget = Number(nums[1]);
      setBudgetVal(Number(nums[1]));
      parsedAny = true;
    }

    // Check location
    if (['kolkata', 'kplkata', 'calcutta'].some((k) => q.includes(k))) {
      stateRef.current.location = 'Kolkata';
      parsedAny = true;
    } else if (['salt lake', 'saltlake', 'solt lake'].some((k) => q.includes(k))) {
      stateRef.current.location = 'Salt Lake';
      parsedAny = true;
    } else if (['garia', 'goria'].some((k) => q.includes(k))) {
      stateRef.current.location = 'Garia';
      parsedAny = true;
    } else if (['new town', 'newtown'].some((k) => q.includes(k))) {
      stateRef.current.location = 'New Town';
      parsedAny = true;
    } else if (['dum dum', 'dumdum'].some((k) => q.includes(k))) {
      stateRef.current.location = 'Dum Dum';
      parsedAny = true;
    } else if (['ballygunge', 'gariahat'].some((k) => q.includes(k))) {
      stateRef.current.location = 'Ballygunge';
      parsedAny = true;
    } else if (['jadavpur'].some((k) => q.includes(k))) {
      stateRef.current.location = 'Jadavpur';
      parsedAny = true;
    } else if (['behala'].some((k) => q.includes(k))) {
      stateRef.current.location = 'Behala';
      parsedAny = true;
    } else if (['park street'].some((k) => q.includes(k))) {
      stateRef.current.location = 'Park Street';
      parsedAny = true;
    } else if (['howrah'].some((k) => q.includes(k))) {
      stateRef.current.location = 'Howrah';
      parsedAny = true;
    }

    // Check sublocation
    if (['sector v', 'sec v', 'sector 5', 'karunamoyee', 'city centre'].some((k) => q.includes(k))) {
      stateRef.current.sublocation = 'Sector V';
      parsedAny = true;
    } else if (['mahamayatala', 'station', 'kavi nazrul', 'patuli'].some((k) => q.includes(k))) {
      stateRef.current.sublocation = q.includes('mahamayatala') ? 'Mahamayatala' : q.includes('patuli') ? 'Patuli' : 'Garia Station';
      parsedAny = true;
    }

    // Check type
    if (q.includes('1 bhk') || q.includes('1bhk')) {
      stateRef.current.type = 'Flat';
      stateRef.current.subtype = '1 BHK';
      parsedAny = true;
    } else if (q.includes('2 bhk') || q.includes('2bhk')) {
      stateRef.current.type = 'Flat';
      stateRef.current.subtype = '2 BHK';
      parsedAny = true;
    } else if (q.includes('3 bhk') || q.includes('3bhk')) {
      stateRef.current.type = 'Flat';
      stateRef.current.subtype = '3 BHK';
      parsedAny = true;
    } else if (q.includes('flat') || q.includes('apartment')) {
      stateRef.current.type = 'Flat';
      parsedAny = true;
    } else if (q.includes('pg') || q.includes('paying guest')) {
      stateRef.current.type = 'PG';
      parsedAny = true;
    } else if (q.includes('room')) {
      stateRef.current.type = 'Room';
      parsedAny = true;
    }

    if (parsedAny) {
      addBotMessage(
        `Got it! Searching rentals${
          stateRef.current.location ? ' in ' + stateRef.current.location : ''
        }${
          stateRef.current.sublocation ? ' (' + stateRef.current.sublocation + ')' : ''
        } under ₹${Number(stateRef.current.budget).toLocaleString('en-IN')}…`
      );
      setTimeout(matchProperties, 400);
      return;
    }

    // 5. Friendly guidance if not recognized
    addBotMessage(
      `I noticed your message: "${raw}". Let me know which area or budget you prefer, or select an option below:`
    );
    if (step === 'location' || !step) {
      askLocation();
    }
  };

  return (
    <div className="pointkey-homemate-wrap">
      <style>{`
        .pointkey-homemate-wrap {
          position: fixed;
          right: 24px;
          bottom: 24px;
          z-index: 99999;
          font-family: 'Montserrat', 'Segoe UI', system-ui, sans-serif;
        }

        .homemate-btn {
          min-width: 60px;
          height: 56px;
          border: 0;
          border-radius: 32px;
          padding: 0 20px;
          background: linear-gradient(135deg, #1f4d3f 0%, #15382e 100%);
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 10px 28px rgba(20, 20, 20, 0.35);
          transition: transform .2s, box-shadow .2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
        }

        .homemate-btn:hover {
          transform: translateY(-2px) scale(1.03);
          box-shadow: 0 14px 34px rgba(20, 20, 20, 0.45);
        }

        .homemate-btn .chat-icon {
          font-size: 20px;
        }

        .homemate-btn .chat-label {
          font-size: 13px;
          font-weight: 800;
          letter-spacing: .02em;
          white-space: nowrap;
        }

        /* CHAT WINDOW */
        .homemate-window {
          position: absolute;
          right: 0;
          bottom: 72px;
          width: 380px;
          max-width: calc(100vw - 28px);
          height: 580px;
          background: #fff;
          border: 1px solid #ebe1c9;
          border-radius: 20px;
          box-shadow: 0 25px 80px rgba(20, 20, 20, 0.28);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          animation: homematePop .22s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes homematePop {
          0% { opacity: 0; transform: translateY(14px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        .homemate-head {
          padding: 14px 16px;
          background: linear-gradient(135deg, #1f4d3f 0%, #15382e 100%);
          color: #fff;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .homemate-avatar {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.2);
          display: grid;
          place-items: center;
          font-weight: 900;
          font-size: 14px;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .homemate-head strong {
          display: block;
          font-size: 15px;
          font-weight: 800;
        }

        .homemate-head small {
          display: block;
          font-size: 11px;
          opacity: .88;
          margin-top: 1px;
        }

        .homemate-close {
          margin-left: auto;
          border: 0;
          background: transparent;
          color: #fff;
          font-size: 24px;
          line-height: 1;
          cursor: pointer;
          opacity: .85;
          transition: opacity .2s;
        }

        .homemate-close:hover {
          opacity: 1;
        }

        .homemate-body {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          background: #f6efdf;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .homemate-msg {
          max-width: 88%;
          padding: 10px 14px;
          border-radius: 14px;
          font-size: 12px;
          line-height: 1.55;
          word-break: break-word;
        }

        .homemate-msg.bot {
          background: #fff;
          border: 1px solid #ebe1c9;
          color: #141414;
          align-self: flex-start;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .homemate-msg.user {
          align-self: flex-end;
          background: #1f4d3f;
          color: #fff;
          box-shadow: 0 3px 10px rgba(31, 77, 63, 0.25);
        }

        .homemate-options {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin: 6px 0 10px;
        }

        .homemate-opt {
          border: 1px solid #ebe1c9;
          background: #fff;
          color: #1f4d3f;
          border-radius: 12px;
          padding: 8px 12px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: all .16s;
          box-shadow: 0 2px 6px rgba(0,0,0,0.03);
        }

        .homemate-opt:hover {
          border-color: #1f4d3f;
          background: #f3ead6;
          transform: translateY(-1px);
        }

        .homemate-slider-box {
          background: #fff;
          border: 1px solid #ebe1c9;
          border-radius: 14px;
          padding: 14px;
          margin: 6px 0;
        }

        .homemate-range {
          width: 100%;
          accent-color: #1f4d3f;
          cursor: pointer;
        }

        .homemate-budget-val {
          font-size: 15px;
          font-weight: 900;
          color: #1f4d3f;
          text-align: center;
          margin: 6px 0 12px;
        }

        .homemate-slider-btn {
          width: 100%;
          border: 0;
          border-radius: 10px;
          padding: 10px;
          background: #1f4d3f;
          color: #fff;
          font-weight: 700;
          font-size: 12px;
          cursor: pointer;
          transition: background .15s;
        }

        .homemate-slider-btn:hover {
          background: #15382e;
        }

        /* Result card inside chatbot */
        .homemate-result-card {
          display: flex;
          gap: 10px;
          padding: 10px;
          background: #fff;
          border: 1px solid #ebe1c9;
          border-radius: 14px;
          cursor: pointer;
          transition: all .2s;
        }

        .homemate-result-card:hover {
          border-color: #1f4d3f;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
        }

        .homemate-result-img {
          width: 64px;
          height: 60px;
          border-radius: 10px;
          object-fit: cover;
          flex-shrink: 0;
        }

        .homemate-result-info {
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .homemate-result-info b {
          font-size: 12px;
          color: #141414;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .homemate-result-info span {
          font-size: 10px;
          color: #5b5547;
          margin-top: 2px;
        }

        .homemate-result-info strong {
          font-size: 12px;
          color: #1f4d3f;
          margin-top: 3px;
        }

        .homemate-why {
          font-size: 9px;
          color: #e08a1e;
          font-weight: 700;
          margin-top: 2px;
        }

        .homemate-typing {
          display: flex;
          gap: 8px;
          padding: 10px 12px;
          background: #fff;
          border-top: 1px solid #ebe1c9;
        }

        .homemate-input {
          flex: 1;
          border: 1.5px solid #d8cba9;
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 12px;
          outline: none;
          color: #141414;
          transition: border-color .15s;
        }

        .homemate-input:focus {
          border-color: #1f4d3f;
          box-shadow: 0 0 0 3px rgba(31, 77, 63, 0.12);
        }

        .homemate-send {
          border: 0;
          border-radius: 12px;
          padding: 0 16px;
          background: #1f4d3f;
          color: #fff;
          font-weight: 800;
          font-size: 12px;
          cursor: pointer;
          transition: background .15s;
        }

        .homemate-send:hover {
          background: #15382e;
        }

        @media (max-width: 768px) {
          .pointkey-homemate-wrap {
            right: 14px;
            bottom: calc(env(safe-area-inset-bottom, 0px) + 68px);
          }
          .homemate-window {
            width: calc(100vw - 28px);
            max-width: 420px;
            height: min(520px, calc(100vh - 150px));
            bottom: 60px;
            right: 0;
            border-radius: 20px;
          }
          .homemate-btn {
            width: 48px;
            height: 48px;
            min-width: 48px;
            padding: 0;
            border-radius: 50%;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
          }
          .homemate-btn .chat-label {
            display: none;
          }
        }
      `}</style>

      {/* CHAT WINDOW */}
      {isOpen && (
        <div className="homemate-window">
          <div className="homemate-head">
            <div className="homemate-avatar">pR</div>
            <div>
              <strong>HomeMate</strong>
              <small>Your Smart Rental Assistant</small>
            </div>
            <button
              className="homemate-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close HomeMate"
            >
              ×
            </button>
          </div>

          <div className="homemate-body" ref={bodyRef}>
            {messages.map((m) => (
              <div key={m.id} className={`homemate-msg ${m.sender}`}>
                {m.text}
              </div>
            ))}

            {/* Interactive Options Pills */}
            {currentOptions && (
              <div className="homemate-options">
                {currentOptions.items.map((opt, i) => (
                  <button
                    key={i}
                    className="homemate-opt"
                    onClick={() => {
                      const cb = currentOptions.callback;
                      setCurrentOptions(null);
                      cb(opt);
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {/* Range Slider for Budget Question */}
            {showBudgetSlider && (
              <div className="homemate-slider-box">
                <input
                  type="range"
                  min={3000}
                  max={50000}
                  step={500}
                  value={budgetVal}
                  onChange={(e) => setBudgetVal(Number(e.target.value))}
                  className="homemate-range"
                />
                <div className="homemate-budget-val">
                  Up to ₹{budgetVal.toLocaleString('en-IN')}/mo
                </div>
                <button
                  className="homemate-slider-btn"
                  onClick={() => {
                    setShowBudgetSlider(false);
                    stateRef.current.budget = budgetVal;
                    addUserMessage(`Up to ₹${budgetVal.toLocaleString('en-IN')}`);
                    matchProperties();
                  }}
                >
                  Find matching homes
                </button>
              </div>
            )}

            {/* Matched Property Cards inside Chat */}
            {matchedResults.length > 0 && (
              <div style={{ display: 'grid', gap: '8px', margin: '4px 0' }}>
                {matchedResults.map((prop, idx) => (
                  <div
                    key={idx}
                    className="homemate-result-card"
                    onClick={() => {
                      setIsOpen(false);
                      navigate(`/tenant/property/${prop.id}`);
                    }}
                  >
                    <img
                      src={prop.image || 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=600&q=80'}
                      alt={prop.title}
                      className="homemate-result-img"
                    />
                    <div className="homemate-result-info">
                      <b>{idx + 1}. {prop.title}</b>
                      <span>{prop.location} · {prop.type || prop.subtype}</span>
                      <strong>₹{Number(prop.price || prop.monthly_rent).toLocaleString('en-IN')}/month</strong>
                      <div className="homemate-why">✓ Verified Match</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="homemate-typing">
            <input
              type="text"
              placeholder="Type your answer..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendTyped()}
              className="homemate-input"
            />
            <button
              onClick={handleSendTyped}
              disabled={busy}
              className="homemate-send"
            >
              {busy ? '…' : 'Send'}
            </button>
          </div>
        </div>
      )}

      {/* FLOATING ACTION BUTTON */}
      <button
        className="homemate-btn"
        onClick={handleOpen}
        aria-label="Open NestAI Assistant"
      >
        <span className="chat-icon">💬</span>
        <span className="chat-label">Ask NestAI</span>
      </button>
    </div>
  );
}
