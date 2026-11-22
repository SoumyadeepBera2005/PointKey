import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { SAMPLE_PROPERTIES } from '../../data/sampleProperties';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

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
  const { user, refreshUser } = useAuth();

  const isSuspended = user?.account_status === 'SUSPENDED';
  const isBlocked = user?.account_status === 'BLOCKED' || (user?.is_blocked && !isSuspended);
  const isRestricted = isSuspended || isBlocked;

  // Real-time status update listener (e.g. Admin approves or rejects appeal, or blocks user)
  useEffect(() => {
    const handleStatusUpdate = (e) => {
      const data = e.detail;
      if (!data) return;
      if (data.unblock_appeal_status === 'REJECTED') {
        addBotMessage(
          `❌ Notice from Admin: Your unblock appeal was rejected (Reason: "${data.block_reason || data.reason || 'Pledge insufficient'}").\n\nSince this is Strike 1, you can submit an updated pledge statement for reconsideration.`
        );
        setCurrentOptions({
          items: ['✍️ Submit New Agreement', '📜 Read Platform Rules', '❓ Why was it rejected?'],
          callback: (opt) => {
            if (opt.includes('Submit') || opt.includes('Agreement')) {
              setShowAppealModal(true);
            } else {
              handleRestrictedChatQuery(opt);
            }
          },
        });
      } else if (data.account_status === 'ACTIVE' && isRestricted) {
        addBotMessage(
          `🎉 Great news! Your unblock appeal has been APPROVED by PointKey Admin!\n\nYour account is now ACTIVE and all restrictions (View Details, Advance Payments, FacilityKart, BudgetKart) have been lifted.`
        );
        setCurrentOptions({
          items: ['🏠 Search Rentals', '✨ Everyday Services (FacilityKart)', '📊 Expense Tracker (BudgetKart)'],
          callback: () => {
            startDialogue();
          },
        });
      }
    };

    window.addEventListener('prent_user_status_changed', handleStatusUpdate);
    return () => window.removeEventListener('prent_user_status_changed', handleStatusUpdate);
  }, [isRestricted]);

  // আনব্লক আপিল স্টেট (Strike 1 Reinstatement Appeal)
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [appealText, setAppealText] = useState('');
  const [submittingAppeal, setSubmittingAppeal] = useState(false);
  const [appealError, setAppealError] = useState('');

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
      if (isBlocked) {
        addBotMessage(
          `⛔ Account Permanently Blocked (Strike 2)\n\nYour account has been permanently terminated due to repeated or critical rule violations.\n\nReason recorded: "${user?.block_reason || 'Repeated rule violations'}".\n\nUnder PointKey Community Safety Guidelines, Strike 2 bans cannot be appealed or restored. If you have questions about our policies, feel free to ask me.`
        );
        setCurrentOptions({
          items: ['📜 Platform Rules', '❓ Why Strike 2 occurs', '🛡️ Community Guidelines'],
          callback: (opt) => handleRestrictedChatQuery(opt),
        });
      } else if (isSuspended) {
        if (user?.unblock_appeal_status === 'SUBMITTED') {
          addBotMessage(
            `👋 Hello! Your account is temporarily suspended (Strike 1), but your Unblock Appeal & signed rules undertaking are currently UNDER REVIEW by PointKey Admin ⏳.\n\nThe admin team verifies all submissions manually to ensure trust and community safety. Once reviewed and approved, your account will be activated immediately.\n\nHow can I help you in the meantime?`
          );
          setCurrentOptions({
            items: ['⏳ Check Appeal Status', '📜 Review Platform Rules', '❓ How long does review take?'],
            callback: (opt) => handleRestrictedChatQuery(opt),
          });
        } else if (user?.unblock_appeal_status === 'REJECTED') {
          addBotMessage(
            `⚠️ Notice: Your previous unblock appeal was reviewed and rejected by PointKey Admin.\n\nReason noted: "${user?.block_reason || 'Pledge terms insufficient'}".\n\nSince this is Strike 1, you can submit an updated pledge statement promising full compliance with PointKey rules. You can ask me any question or submit your new agreement.`
          );
          setCurrentOptions({
            items: ['✍️ Submit New Agreement', '📜 Read Platform Rules', '❓ Why was it rejected?'],
            callback: (opt) => {
              if (opt.includes('Submit') || opt.includes('Agreement')) {
                setShowAppealModal(true);
              } else {
                handleRestrictedChatQuery(opt);
              }
            },
          });
        } else {
          addBotMessage(
            `⚠️ Notice: Your account is currently suspended (Strike 1) for rule violation: "${user?.block_reason || 'Rules violation'}".\n\nTo restore your access to View Details, advance payments, and home services, you can review the rules undertaking and submit an appeal for Admin approval. How can I assist you?`
          );
          setCurrentOptions({
            items: ['✍️ Submit Unblock Appeal', '📜 Platform Rules', '❓ Why was I suspended?'],
            callback: (opt) => {
              if (opt.includes('Submit') || opt.includes('Agreement') || opt.includes('Appeal')) {
                setShowAppealModal(true);
              } else {
                handleRestrictedChatQuery(opt);
              }
            },
          });
        }
      } else {
        startDialogue();
      }
    }
  };

  // আনব্লক আপিল আবেদন সাবমিট করা
  const handleSubmitAppeal = async () => {
    if (!agreedToTerms) return;
    setSubmittingAppeal(true);
    setAppealError('');
    try {
      const payload = {
        statement:
          appealText.trim() ||
          'I have read and solemnly pledge to adhere to all PointKey platform rules and regulations. I will not engage in off-platform deals or fraudulent actions. I understand that a second violation triggers permanent Strike 2 termination.',
      };
      await api.post('/auth/unblock-appeal', payload);
      await refreshUser();
      setShowAppealModal(false);
      setAppealText('');
      addBotMessage(
        '✅ Your Unblock Appeal & signed rules undertaking have been submitted to PointKey Admin! Admin will manually verify and review your application.'
      );
      setCurrentOptions({
        items: ['⏳ Check Appeal Status', '📜 Review Platform Rules', '❓ How long does review take?'],
        callback: (opt) => handleRestrictedChatQuery(opt),
      });
    } catch (err) {
      setAppealError(err.response?.data?.message || 'Failed to submit appeal');
    } finally {
      setSubmittingAppeal(false);
    }
  };

  // Block/Suspension Support AI Assistant query handler
  const handleRestrictedChatQuery = (rawInput) => {
    const q = (rawInput || '').toLowerCase().trim();
    addUserMessage(rawInput);
    setBusy(true);

    setTimeout(() => {
      setBusy(false);

      // 1. Appeal / Activation / Unblock / "Please" / "Kholo" / "Pardon" / Sincere requests
      if (
        [
          'please', 'pleas', 'plz', 'activate', 'active', 'unblock', 'unlock',
          'restore', 'chalu', 'kholo', 'khole', 'khule', 'open', 'appeal',
          'abedon', 'darkhosto', 'apil', 'khoma', 'forgive', 'sorry', 'mistake',
          'bhul', 'help', 'help me', 'unban', 'request', 'reopen'
        ].some((kw) => q.includes(kw))
      ) {
        if (isBlocked) {
          addBotMessage(
            `⛔ Account Permanently Blocked (Strike 2)\n\nI understand your request, but your account has received Strike 2 for repeated or severe rule violations (Reason: "${user?.block_reason || 'Repeated platform rules breach'}").\n\nUnder PointKey Community Safety Guidelines, Strike 2 bans are final and non-reversible. No further appeals or unblock requests can be processed.`
          );
          setCurrentOptions({
            items: ['📜 Platform Rules', '❓ Why Strike 2 occurs', '🛡️ Community Guidelines'],
            callback: (opt) => handleRestrictedChatQuery(opt),
          });
          return;
        }

        if (user?.unblock_appeal_status === 'SUBMITTED') {
          addBotMessage(
            `⏳ Your Unblock Appeal is already SUBMITTED and Under Review!\n\nOur Admin team is currently verifying your signed rules undertaking. This manual verification ensures platform trust and tenant-owner safety.\n\nOnce Admin approves it, your account will be activated immediately and you will receive an in-app notification. Thank you for your patience!`
          );
          setCurrentOptions({
            items: ['⏳ Check Appeal Status', '📜 Review Platform Rules', '❓ How long does review take?'],
            callback: (opt) => handleRestrictedChatQuery(opt),
          });
          return;
        }

        if (user?.unblock_appeal_status === 'REJECTED') {
          addBotMessage(
            `⚠️ Your previous appeal was rejected by PointKey Admin.\n\nReason noted: "${user?.block_reason || 'Pledge was insufficient'}".\n\nSince this is Strike 1, you have another opportunity to submit an updated pledge statement committing to adhere strictly to all PointKey rules (no off-platform direct deals, transparent prices). Would you like to submit a revised appeal now?`
          );
          setCurrentOptions({
            items: ['✍️ Submit New Agreement', '📜 Read Platform Rules', '❓ Why was it rejected?'],
            callback: (opt) => {
              if (opt.includes('Submit') || opt.includes('Agreement')) {
                setShowAppealModal(true);
              } else {
                handleRestrictedChatQuery(opt);
              }
            },
          });
          return;
        }

        // NONE or not submitted yet
        addBotMessage(
          `To restore full access to your account (View Details, Advance Payments, Visit Booking, FacilityKart, BudgetKart), you must submit a signed rules undertaking acknowledging that you will strictly adhere to PointKey terms.\n\nOnce submitted, Admin will review your application and activate your account.`
        );
        setCurrentOptions({
          items: ['✍️ Submit Unblock Appeal', '📜 View Rules & Regulations', '❓ Why was I suspended?'],
          callback: (opt) => {
            if (opt.includes('Submit') || opt.includes('Agreement') || opt.includes('Appeal')) {
              setShowAppealModal(true);
            } else {
              handleRestrictedChatQuery(opt);
            }
          },
        });
        return;
      }

      // 2. Appeal status / Time / Duration ("how long", "kobe hobe", "kobe active hobe", "status")
      if (
        [
          'status', 'kobe', 'somoy', 'koto somoy', 'koto deri', 'deri',
          'how long', 'when', 'time', 'duration', 'pending', 'waiting',
          'somoy lagbe', 'active hobe'
        ].some((kw) => q.includes(kw))
      ) {
        if (isBlocked) {
          addBotMessage(
            `⛔ Account Status: Strike 2 (Permanent Termination).\n\nNo pending appeal exists. Re-activation is not available under platform safety policies.`
          );
          setCurrentOptions({
            items: ['📜 Platform Rules', '❓ Strike System Policy'],
            callback: (opt) => handleRestrictedChatQuery(opt),
          });
          return;
        }

        if (user?.unblock_appeal_status === 'SUBMITTED') {
          const dateStr = user?.unblock_appeal_date
            ? new Date(user.unblock_appeal_date).toLocaleString('en-IN')
            : 'Recently';
          addBotMessage(
            `⏳ Appeal Status: UNDER ADMIN REVIEW\n\n• Application Date: ${dateStr}\n• Expected Review Time: 2 to 24 working hours\n• Status: Queued for Admin verification\n\nAs soon as Admin approves your signed undertaking, all restricted features will unlock automatically.`
          );
          setCurrentOptions({
            items: ['📜 Review Platform Rules', '❓ Can I speed this up?', '❓ Strike Policy'],
            callback: (opt) => handleRestrictedChatQuery(opt),
          });
          return;
        }

        if (user?.unblock_appeal_status === 'REJECTED') {
          addBotMessage(
            `❌ Appeal Status: REJECTED BY ADMIN\n\nYour previous appeal was declined. Your account remains suspended until you submit a revised appeal that is approved by Admin.`
          );
          setCurrentOptions({
            items: ['✍️ Submit New Agreement', '📜 Read Platform Rules', '❓ Why was it rejected?'],
            callback: (opt) => {
              if (opt.includes('Submit') || opt.includes('Agreement')) {
                setShowAppealModal(true);
              } else {
                handleRestrictedChatQuery(opt);
              }
            },
          });
          return;
        }

        addBotMessage(
          `Appeal Status: NOT SUBMITTED YET\n\nYour account is suspended (Strike 1). You have not submitted your reinstatement undertaking yet. Click below to submit:`
        );
        setCurrentOptions({
          items: ['✍️ Submit Unblock Appeal', '📜 View Rules & Regulations'],
          callback: (opt) => {
            if (opt.includes('Submit') || opt.includes('Agreement') || opt.includes('Appeal')) {
              setShowAppealModal(true);
            } else {
              handleRestrictedChatQuery(opt);
            }
          },
        });
        return;
      }

      // 3. Rejection Reason queries ("why rejected", "keno reject", "reason for rejection")
      if (
        [
          'why rejected', 'keno reject', 'reject keno', 'rejection', 'declined',
          'rejected keno', 'reject karon'
        ].some((kw) => q.includes(kw))
      ) {
        addBotMessage(
          `PointKey Admin rejected your previous appeal because the explanation or undertaking was insufficient.\n\n• Logged Reason / Note: "${user?.block_reason || 'Rule violation'}"\n\n💡 Advice for Resubmission: Ensure your pledge clearly states that you understand PointKey platform policies, will make all payments only through the app, and will not engage in any direct off-platform transactions.`
        );
        setCurrentOptions({
          items: ['✍️ Submit New Agreement', '📜 Read Platform Rules', '❓ Strike System Policy'],
          callback: (opt) => {
            if (opt.includes('Submit') || opt.includes('Agreement')) {
              setShowAppealModal(true);
            } else {
              handleRestrictedChatQuery(opt);
            }
          },
        });
        return;
      }

      // 4. Why blocked / Why suspended / Reason / What did I do
      if (
        [
          'why', 'keno', 'karon', 'reason', 'ami ki korlam', 'what did i do',
          'why blocked', 'why suspended', 'violation', 'crime'
        ].some((kw) => q.includes(kw))
      ) {
        addBotMessage(
          `Your account was restricted for: "${user?.block_reason || 'PointKey platform rules & regulations violation'}".\n\nCommon violations include:\n1. Direct cash / off-platform deals bypassing PointKey escrow.\n2. Inaccurate or misleading property photos / fake listings.\n3. Quoting or demanding rent higher than displayed on the app.\n4. Misconduct or harassment during visits or messaging.`
        );
        setCurrentOptions({
          items: isBlocked
            ? ['📜 Platform Rules', '❓ Strike System Policy']
            : ['✍️ Submit Unblock Appeal', '📜 View Rules & Regulations', '⏳ Check Appeal Status'],
          callback: (opt) => {
            if (opt.includes('Submit') || opt.includes('Agreement') || opt.includes('Appeal')) {
              setShowAppealModal(true);
            } else {
              handleRestrictedChatQuery(opt);
            }
          },
        });
        return;
      }

      // 5. Rules & Regulations / Guidelines / Niyom
      if (
        [
          'rule', 'rules', 'regulation', 'regulations', 'niyom', 'guideline',
          'guidelines', 'policy', 'terms', 'condition', 'conditions',
          'undertaking', 'pledge', 'agreement', 'aggrement'
        ].some((kw) => q.includes(kw))
      ) {
        addBotMessage(
          `📌 PointKey Platform Rules & Undertaking Guidelines:\n\n1. In-App Payments Only: Advance tokens, security deposits, and rents must be transacted through PointKey checkout to protect both parties.\n2. Honest Listings: No fake photos, AI-altered images, or hidden charges. The displayed price is binding.\n3. Respectful Conduct: Safe, polite, and transparent communication.\n4. Two-Strike Rule: Strike 1 = Temporary suspension (1 appeal allowed). Strike 2 = Permanent ban (Zero appeals).`
        );
        setCurrentOptions({
          items: isBlocked
            ? ['❓ Why Strike 2 occurs', '🛡️ Community Guidelines']
            : ['✍️ Submit Unblock Appeal', '⏳ Check Appeal Status', '❓ Strike Policy'],
          callback: (opt) => {
            if (opt.includes('Submit') || opt.includes('Agreement') || opt.includes('Appeal')) {
              setShowAppealModal(true);
            } else {
              handleRestrictedChatQuery(opt);
            }
          },
        });
        return;
      }

      // 6. Strike System / Permanent ban queries
      if (
        [
          'strike', 'warning', 'permanent', 'ban', '2nd time', 'second time',
          'two strike', 'two-strike'
        ].some((kw) => q.includes(kw))
      ) {
        addBotMessage(
          `⚠️ PointKey Two-Strike Accountability System:\n\n• Strike 1 (Suspension): Triggered upon first verified rule breach. View Details, Payments, Booking, FacilityKart, and BudgetKart are disabled. User can submit 1 rules pledge appeal for Admin verification.\n• Strike 2 (Permanent Termination): If an unblocked user breaches rules a second time, the account is permanently blocked with zero appeals permitted.`
        );
        setCurrentOptions({
          items: isBlocked
            ? ['📜 Platform Rules', '🛡️ Community Guidelines']
            : ['✍️ Submit Unblock Appeal', '📜 Platform Rules', '❓ Why was I suspended?'],
          callback: (opt) => {
            if (opt.includes('Submit') || opt.includes('Agreement') || opt.includes('Appeal')) {
              setShowAppealModal(true);
            } else {
              handleRestrictedChatQuery(opt);
            }
          },
        });
        return;
      }

      // 7. Speed up / Admin contact / Helpdesk
      if (['speed', 'fast', 'taratari', 'druto', 'contact', 'admin', 'number', 'call'].some((kw) => q.includes(kw))) {
        addBotMessage(
          `PointKey Admin prioritizes pending reinstatement appeals in the queue. You do not need to call or email separately — the Admin dashboard actively notifies the team. Ensure your signed undertaking clearly pledges compliance so it can be approved on first review.`
        );
        setCurrentOptions({
          items: ['⏳ Check Appeal Status', '📜 Platform Rules', '✍️ Submit Appeal'],
          callback: (opt) => {
            if (opt.includes('Submit') || opt.includes('Agreement') || opt.includes('Appeal')) {
              setShowAppealModal(true);
            } else {
              handleRestrictedChatQuery(opt);
            }
          },
        });
        return;
      }

      // 8. Greetings / Assistant intro ("hi", "hello", "hey", "suno", "brother", "bhai", "ai", "who are you")
      if (['hi', 'hello', 'hey', 'suno', 'bhai', 'brother', 'dada', 'namaskar', 'good morning', 'good afternoon', 'good evening', 'who are you'].some((kw) => q === kw || q.startsWith(kw))) {
        addBotMessage(
          `👋 Hello! I am HomeMate, your PointKey AI Assistant.\n\nI am here to help you resolve your account ${isBlocked ? 'permanent block (Strike 2)' : 'suspension (Strike 1)'}, explain platform rules, or help you submit an unblock appeal to the Admin. How may I assist you?`
        );
        setCurrentOptions({
          items: isBlocked
            ? ['📜 Platform Rules', '❓ Strike System Policy', '🛡️ Community Guidelines']
            : user?.unblock_appeal_status === 'SUBMITTED'
            ? ['⏳ Check Appeal Status', '📜 Review Platform Rules', '❓ How long does review take?']
            : user?.unblock_appeal_status === 'REJECTED'
            ? ['✍️ Submit New Agreement', '📜 Read Platform Rules', '❓ Why was it rejected?']
            : ['✍️ Submit Unblock Appeal', '📜 Platform Rules', '❓ Why was I suspended?'],
          callback: (opt) => {
            if (opt.includes('Submit') || opt.includes('Agreement') || opt.includes('Appeal')) {
              setShowAppealModal(true);
            } else {
              handleRestrictedChatQuery(opt);
            }
          },
        });
        return;
      }

      // 9. Natural contextual fallback for any other message
      addBotMessage(
        `I understand your message: "${rawInput}".\n\nCurrently, your account is ${
          isBlocked ? 'permanently blocked (Strike 2)' : 'suspended (Strike 1)'
        } due to: "${user?.block_reason || 'Rule violation'}". All booking, payment, and home service actions are disabled by Admin.\n\nI am here to guide you with the unblock process and platform guidelines. Please choose an option below or ask any specific question:`
      );
      setCurrentOptions({
        items: isBlocked
          ? ['📜 Platform Rules', '❓ Strike System Policy', '🛡️ Community Guidelines']
          : user?.unblock_appeal_status === 'SUBMITTED'
          ? ['⏳ Check Appeal Status', '📜 Review Platform Rules', '❓ How long does review take?']
          : user?.unblock_appeal_status === 'REJECTED'
          ? ['✍️ Submit New Agreement', '📜 Read Platform Rules', '❓ Why was it rejected?']
          : ['✍️ Submit Unblock Appeal', '📜 Platform Rules', '❓ Why was I suspended?'],
        callback: (opt) => {
          if (opt.includes('Submit') || opt.includes('Agreement') || opt.includes('Appeal')) {
            setShowAppealModal(true);
          } else {
            handleRestrictedChatQuery(opt);
          }
        },
      });
    }, 250);
  };

  const handleSendTyped = (e) => {
    if (e) e.preventDefault();
    const raw = inputText.trim();
    if (!raw) return;
    setInputText('');

    if (isRestricted) {
      handleRestrictedChatQuery(raw);
      return;
    }

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
          white-space: pre-wrap;
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

        /* STRIKE SYSTEM BANNER & APPEAL MODAL STYLES */
        .homemate-strike-card {
          background: #ffffff;
          border: 1.5px solid #f59e0b;
          border-radius: 14px;
          padding: 12px 14px;
          margin-bottom: 8px;
          box-shadow: 0 4px 14px rgba(245, 158, 11, 0.12);
        }
        .homemate-strike-card.blocked {
          border-color: #e11d48;
          box-shadow: 0 4px 14px rgba(225, 29, 72, 0.12);
        }
        .strike-badge-label {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #fef3c7;
          color: #92400e;
          border: 1px solid #fde68a;
          border-radius: 8px;
          font-size: 10px;
          font-weight: 800;
          padding: 2px 8px;
          text-transform: uppercase;
          letter-spacing: .02em;
        }
        .homemate-strike-card.blocked .strike-badge-label {
          background: #ffe4e6;
          color: #9f1239;
          border-color: #fecdd3;
        }
        .strike-title {
          font-size: 13px;
          font-weight: 800;
          color: #1f2937;
          margin: 6px 0 2px;
        }
        .strike-reason {
          font-size: 11px;
          color: #4b5563;
          margin: 0 0 5px;
          line-height: 1.4;
        }
        .strike-reason strong {
          color: #111827;
        }
        .strike-subtext {
          font-size: 10.5px;
          color: #6b7280;
          line-height: 1.4;
          margin: 0 0 8px;
        }
        .appeal-open-btn {
          width: 100%;
          border: 0;
          border-radius: 10px;
          background: #1f4d3f;
          color: #ffffff;
          font-size: 11px;
          font-weight: 800;
          padding: 8px 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: transform .15s, background .15s;
        }
        .appeal-open-btn:hover {
          background: #15382e;
          transform: translateY(-1px);
        }
        .appeal-submitted-notice {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 10px;
          padding: 8px 10px;
          font-size: 10.5px;
          color: #166534;
          display: flex;
          align-items: flex-start;
          gap: 6px;
          line-height: 1.35;
        }
        .appeal-rejected-notice {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          padding: 8px 10px;
          font-size: 10.5px;
          color: #991b1b;
          display: flex;
          align-items: flex-start;
          gap: 6px;
          line-height: 1.35;
        }

        /* APPEAL MODAL OVERLAY INSIDE WINDOW */
        .homemate-appeal-overlay {
          position: absolute;
          inset: 0;
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(4px);
          z-index: 999;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          border-radius: 20px;
          overflow: hidden;
          animation: modalSlideUp .22s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes modalSlideUp {
          0% { opacity: 0; transform: translateY(24px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .homemate-appeal-sheet {
          background: #ffffff;
          border-radius: 20px 20px 0 0;
          padding: 16px;
          max-height: 92%;
          overflow-y: auto;
          box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.3);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .appeal-sheet-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          border-bottom: 1px solid #ebe1c9;
          padding-bottom: 8px;
        }
        .appeal-sheet-head h4 {
          margin: 0;
          font-size: 13.5px;
          font-weight: 800;
          color: #1f4d3f;
        }
        .appeal-sheet-head p {
          margin: 2px 0 0;
          font-size: 10px;
          color: #6b7280;
        }
        .appeal-sheet-close {
          border: 0;
          background: #f3f4f6;
          border-radius: 8px;
          width: 24px;
          height: 24px;
          font-size: 13px;
          cursor: pointer;
          display: grid;
          place-items: center;
          color: #4b5563;
        }
        .appeal-rules-box {
          background: #faf7f0;
          border: 1px solid #ebe1c9;
          border-radius: 12px;
          padding: 10px 12px;
          font-size: 11px;
          color: #4b5563;
          line-height: 1.45;
        }
        .appeal-rules-box h6 {
          margin: 0 0 6px;
          font-size: 11px;
          font-weight: 800;
          color: #1f4d3f;
        }
        .appeal-rules-box ul {
          margin: 0;
          padding-left: 14px;
        }
        .appeal-rules-box li {
          margin-bottom: 4px;
        }
        .appeal-warning-box {
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 10px;
          padding: 8px 10px;
          font-size: 10.5px;
          color: #92400e;
          line-height: 1.35;
        }
        .appeal-textarea {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          padding: 8px 10px;
          font-size: 11px;
          box-sizing: border-box;
          font-family: inherit;
          resize: none;
        }
        .appeal-checkbox-row {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 10.5px;
          color: #374151;
          line-height: 1.35;
          cursor: pointer;
        }
        .appeal-checkbox-row input {
          margin-top: 2px;
          accent-color: #1f4d3f;
        }
        .appeal-action-row {
          display: flex;
          gap: 8px;
          margin-top: 4px;
        }
        .appeal-submit-btn {
          flex: 1;
          border: 0;
          border-radius: 10px;
          background: #1f4d3f;
          color: #ffffff;
          font-size: 11px;
          font-weight: 800;
          padding: 9px;
          cursor: pointer;
          transition: opacity .15s;
        }
        .appeal-submit-btn:disabled {
          opacity: .5;
          cursor: not-allowed;
        }
        .appeal-cancel-btn {
          border: 1px solid #d1d5db;
          border-radius: 10px;
          background: #ffffff;
          color: #4b5563;
          font-size: 11px;
          font-weight: 700;
          padding: 9px 12px;
          cursor: pointer;
        }
      `}</style>

      {/* CHAT WINDOW */}
      {isOpen && (
        <div className="homemate-window">
          <div className="homemate-head">
            <div className="homemate-avatar">pR</div>
            <div>
              <strong>HomeMate</strong>
              <small>{isRestricted ? 'Account & Rules Support AI' : 'Your Smart Rental Assistant'}</small>
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
            {/* STRIKE 1 & STRIKE 2 PERSISTENT NOTICE CARD */}
            {user?.account_status === 'SUSPENDED' && (
              <div className="homemate-strike-card">
                <span className="strike-badge-label">⚠️ Rule Violation · Strike 1 of 2</span>
                <h5 className="strike-title">Account Suspended by Admin</h5>
                <p className="strike-reason">
                  <strong>Reason:</strong> {user.block_reason || 'PointKey platform rules & regulations violation.'}
                </p>
                <p className="strike-subtext">
                  Your access to View Details, Advance Payments, and Visit Bookings is currently disabled by Admin.
                </p>

                {user.unblock_appeal_status === 'SUBMITTED' ? (
                  <div className="appeal-submitted-notice">
                    <span>⏳</span>
                    <div>
                      <strong>Appeal Under Review</strong>
                      <p style={{ margin: '2px 0 0' }}>Your signed rules undertaking has been submitted to Admin. Access will be restored upon manual approval.</p>
                    </div>
                  </div>
                ) : user.unblock_appeal_status === 'REJECTED' ? (
                  <div>
                    <div className="appeal-rejected-notice">
                      <span>✕</span>
                      <span>Your previous appeal was rejected by Admin. You may submit an updated pledge.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAppealModal(true)}
                      className="appeal-open-btn"
                      style={{ marginTop: '6px' }}
                    >
                      📝 Resubmit Unblock Agreement
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAppealModal(true)}
                    className="appeal-open-btn"
                  >
                    📝 Unblock Me / Appeal Suspension
                  </button>
                )}
              </div>
            )}

            {user?.account_status === 'BLOCKED' && (
              <div className="homemate-strike-card blocked">
                <span className="strike-badge-label">⛔ Permanent Ban · Strike 2</span>
                <h5 className="strike-title">Account Permanently Blocked</h5>
                <p className="strike-reason">
                  <strong>Reason:</strong> {user.block_reason || 'Repeated rule violations.'}
                </p>
                <p className="strike-subtext">
                  In accordance with PointKey zero-tolerance community safety policies, repeated violations result in permanent account termination. No appeals or unblocking are permitted.
                </p>
              </div>
            )}

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
              placeholder={isRestricted ? "Ask about your suspension, rules, or unblock appeal..." : "Type your answer..."}
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

          {/* ===============================================================
              REINSTATEMENT APPEAL & RULES UNDERTAKING SHEET (STRIKE 1 ONLY)
              =============================================================== */}
          {showAppealModal && (
            <div className="homemate-appeal-overlay">
              <div className="homemate-appeal-sheet">
                <div className="appeal-sheet-head">
                  <div>
                    <h4>PointKey Reinstatement Undertaking</h4>
                    <p>Community Rules &amp; Regulations Agreement (1st Warning)</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAppealModal(false)}
                    className="appeal-sheet-close"
                  >
                    ✕
                  </button>
                </div>

                <div className="appeal-warning-box">
                  <strong>⚠️ Critical Notice:</strong> This is your <u>First and Only Warning (Strike 1)</u>. Once unblocked by Admin, any future rule breach will trigger <strong>Strike 2 (Permanent Ban)</strong> with zero appeals allowed.
                </div>

                <div className="appeal-rules-box">
                  <h6>PointKey Platform Rules Undertaking:</h6>
                  <ul>
                    <li><strong>1. No AI / Fake Room Photos:</strong> All photos must genuinely represent the actual property taken on-site.</li>
                    <li><strong>2. No Off-Platform Deals:</strong> Advance payments &amp; bookings must strictly be made via PointKey escrow checkout. Demanding cash/direct UPI is strictly forbidden.</li>
                    <li><strong>3. Price Transparency:</strong> The rent amount and terms on the app are binding. Demanding extra charges is a direct rule violation.</li>
                    <li><strong>4. Honesty &amp; Fair Conduct:</strong> Accurate representation of amenities and respectful communication.</li>
                  </ul>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>
                    Your Pledge / Explanation to Admin:
                  </label>
                  <textarea
                    rows={2}
                    value={appealText}
                    onChange={(e) => setAppealText(e.target.value)}
                    placeholder="I acknowledge the platform rules and pledge to strictly follow PointKey guidelines without violation..."
                    className="appeal-textarea"
                  />
                </div>

                <label className="appeal-checkbox-row">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                  />
                  <span>
                    I have read, understood, and solemnly pledge to follow all PointKey rules and regulations. I acknowledge that any second violation results in permanent Strike 2 termination.
                  </span>
                </label>

                {appealError && (
                  <p style={{ color: '#dc2626', fontSize: '10.5px', margin: '2px 0' }}>{appealError}</p>
                )}

                <div className="appeal-action-row">
                  <button
                    type="button"
                    onClick={() => setShowAppealModal(false)}
                    className="appeal-cancel-btn"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!agreedToTerms || submittingAppeal}
                    onClick={handleSubmitAppeal}
                    className="appeal-submit-btn"
                  >
                    {submittingAppeal ? 'Submitting Application...' : 'Submit Unblock Application'}
                  </button>
                </div>
              </div>
            </div>
          )}
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
