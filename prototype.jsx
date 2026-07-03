import { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Clock,
  MessageCircle,
  Star,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Send,
  X,
  Navigation,
  Camera,
  Utensils,
  Landmark,
  TreePine,
  ShoppingBag,
  Zap,
  Coffee,
  ArrowLeft,
  MoreHorizontal,
  Image,
  Share2,
  Copy,
  Download,
  Undo2,
} from 'lucide-react';

const STYLES = [
  { id: 'art', label: '文艺', icon: Camera },
  { id: 'food', label: '美食', icon: Utensils },
  { id: 'family', label: '亲子', icon: Star },
  { id: 'nature', label: '自然', icon: TreePine },
  { id: 'shop', label: '购物', icon: ShoppingBag },
  { id: 'relax', label: '休闲', icon: Coffee },
  { id: 'walk', label: '暴走', icon: Zap },
];

const CITIES = ['杭州', '成都', '厦门', '大理', '西安', '长沙', '重庆', '丽江', '苏州', '青岛'];

const MOCK_TRIP = {
  destination: '杭州',
  days: 3,
  styleTags: ['food'],
  itinerary: [
    {
      dayIndex: 1,
      summary: { distance: '8.5km', cost: '¥420', spots: 5 },
      cards: [
        {
          id: 'c1',
          type: 'spot',
          name: '西湖断桥',
          time: '09:00-11:00',
          desc: '西湖十景之一，白蛇传故事发源地',
          rating: 4.6,
          price: '免费',
          transport: null,
          starred: true,
        },
        {
          id: 'c2',
          type: 'food',
          name: '知味观·味庄',
          time: '11:30-13:00',
          desc: '百年老字号，杭帮菜代表',
          rating: 4.5,
          price: '¥120/人',
          transport: '步行 15分钟',
          starred: false,
        },
        {
          id: 'c3',
          type: 'spot',
          name: '灵隐寺',
          time: '14:00-16:00',
          desc: '千年古刹，飞来峰摩崖石刻',
          rating: 4.7,
          price: '¥75',
          transport: '打车 20分钟',
          starred: false,
        },
        {
          id: 'c4',
          type: 'food',
          name: '楼外楼',
          time: '17:30-19:00',
          desc: '西湖醋鱼、龙井虾仁名店',
          rating: 4.4,
          price: '¥150/人',
          transport: '打车 25分钟',
          starred: false,
        },
        {
          id: 'c5',
          type: 'spot',
          name: '南宋御街夜游',
          time: '19:30-21:00',
          desc: '南宋古街夜景，文艺小店聚集',
          rating: 4.3,
          price: '免费',
          transport: '步行 10分钟',
          starred: false,
        },
      ],
    },
    {
      dayIndex: 2,
      summary: { distance: '6.2km', cost: '¥380', spots: 4 },
      cards: [
        {
          id: 'c6',
          type: 'spot',
          name: '西溪国家湿地公园',
          time: '09:00-12:00',
          desc: '城市湿地公园，摇橹船游览',
          rating: 4.5,
          price: '¥80',
          transport: null,
          starred: false,
        },
        {
          id: 'c7',
          type: 'food',
          name: '外婆家(龙翔桥店)',
          time: '12:30-13:30',
          desc: '性价比极高的杭帮菜连锁',
          rating: 4.3,
          price: '¥60/人',
          transport: '地铁 30分钟',
          starred: false,
        },
        {
          id: 'c8',
          type: 'spot',
          name: '中国丝绸博物馆',
          time: '14:30-16:30',
          desc: '了解中国丝绸五千年历史',
          rating: 4.4,
          price: '免费',
          transport: '步行 15分钟',
          starred: false,
        },
        {
          id: 'c9',
          type: 'spot',
          name: '太子湾公园',
          time: '17:00-18:30',
          desc: '西湖南线免费公园，花海浪漫',
          rating: 4.6,
          price: '免费',
          transport: '打车 15分钟',
          starred: false,
        },
      ],
    },
    {
      dayIndex: 3,
      summary: { distance: '5.8km', cost: '¥350', spots: 4 },
      cards: [
        {
          id: 'c10',
          type: 'spot',
          name: '龙井村茶园',
          time: '09:00-11:00',
          desc: '龙井茶原产地，体验采茶制茶',
          rating: 4.5,
          price: '¥50',
          transport: null,
          starred: false,
        },
        {
          id: 'c11',
          type: 'food',
          name: '龙井草堂',
          time: '11:30-13:00',
          desc: '茶园中的私房菜，龙井虾仁一绝',
          rating: 4.7,
          price: '¥200/人',
          transport: '步行 5分钟',
          starred: false,
        },
        {
          id: 'c12',
          type: 'spot',
          name: '九溪烟树',
          time: '14:00-16:00',
          desc: '溪水潺潺，夏日避暑胜地',
          rating: 4.6,
          price: '免费',
          transport: '打车 15分钟',
          starred: false,
        },
        {
          id: 'c13',
          type: 'spot',
          name: '河坊街',
          time: '17:00-19:00',
          desc: '明清古街，小吃和手工艺品',
          rating: 4.2,
          price: '免费',
          transport: '打车 25分钟',
          starred: false,
        },
      ],
    },
  ],
};

const typeIcon = (type) => (type === 'food' ? Utensils : Landmark);
const typeColor = (type) =>
  type === 'food' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600';
const dayColors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500'];
const dayLightColors = [
  'bg-blue-50 text-blue-700 border-blue-200',
  'bg-emerald-50 text-emerald-700 border-emerald-200',
  'bg-amber-50 text-amber-700 border-amber-200',
];

export default function TripFlowPrototype() {
  const [page, setPage] = useState('home');
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState(3);
  const [selectedStyles, setSelectedStyles] = useState(['food']);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [trip, setTrip] = useState(null);
  const [viewMode, setViewMode] = useState('timeline');
  const [expandedDay, setExpandedDay] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [highlightedCards, setHighlightedCards] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeDayTab, setActiveDayTab] = useState(0);

  const chatEndRef = useRef(null);
  const chatTimerRef = useRef(null);
  const highlightTimerRef = useRef(null);
  const filteredCities = CITIES.filter((c) => destination && c.includes(destination));

  const loadingTexts = [
    '正在搜索杭州的热门景点…',
    '正在规划最佳路线…',
    '正在匹配美食推荐…',
    '正在生成行程…',
  ];

  useEffect(() => {
    if (loading) {
      let i = 0;
      setLoadingText(loadingTexts[0]);
      const iv = setInterval(() => {
        i++;
        if (i < loadingTexts.length) setLoadingText(loadingTexts[i]);
      }, 1200);
      const timeout = setTimeout(() => {
        clearInterval(iv);
        setLoading(false);
        setTrip(MOCK_TRIP);
        setPage('trip');
      }, 4800);
      return () => {
        clearInterval(iv);
        clearTimeout(timeout);
      };
    }
  }, [loading]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const toggleStyle = (id) => {
    setSelectedStyles((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : prev.length < 3 ? [...prev, id] : prev,
    );
  };

  const handleGenerate = () => {
    if (!destination) return;
    setLoading(true);
  };

  const handleChatSend = () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', text: msg }]);

    // 清理之前的定时器
    if (chatTimerRef.current) clearTimeout(chatTimerRef.current);
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);

    chatTimerRef.current = setTimeout(() => {
      let reply = '';
      if (msg.includes('换') || msg.includes('替')) {
        reply =
          '好的，我为你推荐 3 个替代景点：\n1. 🏯 雷峰塔 — 西湖地标，登高望远（¥40）\n2. 🌿 曲院风荷 — 夏日荷花盛景（免费）\n3. 🎭 宋城 — 大型演出，沉浸式体验（¥310）\n\n你想选哪个？';
        setHighlightedCards(['c3']);
        highlightTimerRef.current = setTimeout(() => setHighlightedCards([]), 3000);
      } else if (msg.includes('加') || msg.includes('新增')) {
        reply = '已在第三天下午插入：\n🌊 钱塘江边骑行 — 沿滨江绿道骑行，欣赏江景（约1.5小时）';
      } else if (msg.includes('删') || msg.includes('去')) {
        reply = '已删除「中国丝绸博物馆」，下午时段空出来了。需要我推荐其他活动吗？';
      } else if (msg.includes('预算') || msg.includes('便宜')) {
        reply =
          '已为你调整预算方案：\n• 楼外楼 → 替换为新白鹿餐厅（¥60/人）\n• 龙井草堂 → 替换为弄堂里（¥80/人）\n整体预算降低约 ¥300';
      } else {
        reply = '收到！我来帮你调整。你可以更具体地描述一下吗？比如想调整哪一天的行程？';
      }
      setChatMessages((prev) => [...prev, { role: 'ai', text: reply }]);
    }, 1500);
  };

  // 清理定时器（组件卸载时）
  useEffect(() => {
    return () => {
      if (chatTimerRef.current) clearTimeout(chatTimerRef.current);
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    };
  }, []);

  const toggleStar = (cardId) => {
    setTrip((prev) => ({
      ...prev,
      itinerary: prev.itinerary.map((day) => ({
        ...day,
        cards: day.cards.map((c) => (c.id === cardId ? { ...c, starred: !c.starred } : c)),
      })),
    }));
  };

  // ============ HOME PAGE ============
  const renderHome = () => (
    <div className="flex flex-col h-full bg-gradient-to-b from-sky-50 to-white">
      <div className="px-6 pt-12 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Navigation className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-800">途灵 TripFlow</span>
        </div>
        <p className="text-sm text-gray-400 mt-1">AI 帮你规划完美旅程</p>
      </div>

      <div className="flex-1 px-6 overflow-y-auto">
        {/* Destination */}
        <div className="mb-5">
          <label className="text-sm font-medium text-gray-600 mb-2 block">去哪里？</label>
          <div className="relative">
            <div className="flex items-center bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
              <MapPin className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
              <input
                type="text"
                placeholder="输入城市或景点名"
                value={destination}
                onChange={(e) => {
                  setDestination(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="flex-1 text-base outline-none bg-transparent text-gray-800 placeholder-gray-300"
              />
            </div>
            {showSuggestions && filteredCities.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 z-10 overflow-hidden">
                {filteredCities.slice(0, 5).map((city) => (
                  <button
                    key={city}
                    onClick={() => {
                      setDestination(city);
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center gap-2 text-sm text-gray-700 transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-gray-400" /> {city}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Days */}
        <div className="mb-5">
          <label className="text-sm font-medium text-gray-600 mb-2 block">去几天？</label>
          <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
            <Clock className="w-5 h-5 text-gray-400" />
            <div className="flex items-center gap-4 flex-1 justify-center">
              <button
                onClick={() => setDays(Math.max(1, days - 1))}
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 active:scale-95 transition-all font-bold text-lg"
              >
                -
              </button>
              <span className="text-2xl font-bold text-gray-800 w-12 text-center">{days}</span>
              <button
                onClick={() => setDays(Math.min(15, days + 1))}
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 active:scale-95 transition-all font-bold text-lg"
              >
                +
              </button>
              <span className="text-sm text-gray-400">天</span>
            </div>
          </div>
        </div>

        {/* Style Tags */}
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-600 mb-2 block">
            旅行风格 <span className="text-gray-400 font-normal">(可选，最多3个)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {STYLES.map(({ id, label, icon: Icon }) => {
              const active = selectedStyles.includes(id);
              return (
                <button
                  key={id}
                  onClick={() => toggleStyle(id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all active:scale-95 ${
                    active
                      ? 'bg-blue-500 text-white shadow-md shadow-blue-200'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <div className="px-6 pb-8 pt-2">
        <button
          onClick={handleGenerate}
          disabled={!destination || loading}
          className={`w-full py-4 rounded-2xl text-base font-semibold transition-all active:scale-[0.98] ${
            destination && !loading
              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-200'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {loading ? '生成中…' : '生成行程'}
        </button>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          style={{
            width: 390,
            height: 760,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%,-50%)',
            borderRadius: 40,
          }}
        >
          <div className="bg-white rounded-3xl px-8 py-10 flex flex-col items-center shadow-2xl">
            <div className="w-14 h-14 rounded-full border-4 border-blue-200 border-t-blue-500 animate-spin mb-5" />
            <p className="text-base font-semibold text-gray-800 mb-2">AI 正在规划行程</p>
            <p className="text-sm text-gray-400 transition-all">{loadingText}</p>
          </div>
        </div>
      )}
    </div>
  );

  // ============ CARD DETAIL PANEL ============
  const renderCardDetail = () => {
    if (!selectedCard) return null;
    const Icon = typeIcon(selectedCard.type);
    return (
      <div className="absolute inset-0 z-40 flex items-end" onClick={() => setSelectedCard(null)}>
        <div className="absolute inset-0 bg-black/30" />
        <div
          className="relative w-full bg-white rounded-t-3xl max-h-[65%] overflow-y-auto animate-slide-up"
          onClick={(e) => e.stopPropagation()}
          style={{ animation: 'slideUp 0.3s ease-out' }}
        >
          <div className="sticky top-0 bg-white z-10 pt-3 pb-2 px-5 border-b border-gray-100">
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${typeColor(selectedCard.type)}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-800">{selectedCard.name}</h3>
                  <p className="text-xs text-gray-400">{selectedCard.time}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCard(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
          <div className="px-5 py-4 space-y-4">
            <p className="text-sm text-gray-600 leading-relaxed">{selectedCard.desc}</p>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1 text-gray-500">
                <Star className="w-4 h-4 text-yellow-500" />
                {selectedCard.rating}
              </div>
              <div className="flex items-center gap-1 text-gray-500">💰 {selectedCard.price}</div>
              {selectedCard.transport && (
                <div className="flex items-center gap-1 text-gray-500">
                  🚶 {selectedCard.transport}
                </div>
              )}
            </div>
            <div className="h-32 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-sm">
              📷 实景照片区域
            </div>
            <div className="flex gap-3 pb-4">
              <button
                onClick={() => {
                  toggleStar(selectedCard.id);
                  setSelectedCard(null);
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 flex items-center justify-center gap-1.5 hover:bg-yellow-50 transition-colors"
              >
                <Star
                  className={`w-4 h-4 ${selectedCard.starred ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`}
                />
                {selectedCard.starred ? '已标记必去' : '标记必去'}
              </button>
              <button className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-blue-500 text-white flex items-center justify-center gap-1.5 hover:bg-blue-600 transition-colors">
                <RefreshCw className="w-4 h-4" /> 替换
              </button>
              <button className="py-2.5 px-4 rounded-xl text-sm font-medium border border-red-200 text-red-500 flex items-center justify-center gap-1.5 hover:bg-red-50 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============ CHAT PANEL ============
  const renderChatPanel = () => {
    if (!chatOpen) return null;
    return (
      <div className="absolute inset-0 z-50 flex items-end" onClick={() => setChatOpen(false)}>
        <div className="absolute inset-0 bg-black/20" />
        <div
          className="relative w-full bg-white rounded-t-3xl flex flex-col"
          style={{ height: '60%', animation: 'slideUp 0.3s ease-out' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="pt-3 pb-2 px-5 border-b border-gray-100 flex-shrink-0">
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-3" />
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-800">对话调整</h3>
              <button
                onClick={() => setChatOpen(false)}
                className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {chatMessages.length === 0 && (
              <div className="text-center py-6">
                <MessageCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">试试说：</p>
                <div className="flex flex-wrap gap-2 mt-2 justify-center">
                  {['第二天下午换个户外景点', '预算再低一些', '多加一些美食'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setChatInput(s)}
                      className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-line ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white rounded-br-md'
                      : 'bg-gray-100 text-gray-700 rounded-bl-md'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                placeholder="说点什么来调整行程…"
                className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400"
              />
              <button
                onClick={handleChatSend}
                disabled={!chatInput.trim()}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${chatInput.trim() ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'}`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============ MAP VIEW ============
  const renderMapView = () => {
    const allCards = trip.itinerary.flatMap((d) => d.cards);
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex gap-2 px-4 py-2 overflow-x-auto flex-shrink-0">
          <button
            onClick={() => setActiveDayTab(0)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${activeDayTab === 0 ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            全部
          </button>
          {trip.itinerary.map((d, i) => (
            <button
              key={i}
              onClick={() => setActiveDayTab(i + 1)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${activeDayTab === i + 1 ? `${dayColors[i]} text-white` : 'bg-gray-100 text-gray-600'}`}
            >
              Day {d.dayIndex}
            </button>
          ))}
        </div>
        <div className="flex-1 relative bg-gradient-to-br from-emerald-50 via-sky-50 to-blue-50 mx-4 mb-4 rounded-2xl overflow-hidden border border-gray-200">
          {/* Simulated map */}
          <div className="absolute inset-0 opacity-20">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          {/* Route lines */}
          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
            {trip.itinerary.map((day, di) => {
              if (activeDayTab !== 0 && activeDayTab !== di + 1) return null;
              const positions = day.cards.map((_, ci) => {
                const cols = Math.min(day.cards.length, 3);
                const row = Math.floor(ci / cols);
                const col = ci % cols;
                const x = 60 + col * 100 + di * 20;
                const y = 60 + row * 90 + di * 15;
                return { x, y };
              });
              return positions.map((pos, ci) => {
                if (ci === 0) return null;
                const prev = positions[ci - 1];
                return (
                  <line
                    key={`${di}-${ci}`}
                    x1={prev.x}
                    y1={prev.y}
                    x2={pos.x}
                    y2={pos.y}
                    stroke={['#3b82f6', '#10b981', '#f59e0b'][di]}
                    strokeWidth="2"
                    strokeDasharray="6 3"
                    opacity={0.6}
                  />
                );
              });
            })}
          </svg>
          {/* Bubbles */}
          {trip.itinerary.map((day, di) => {
            if (activeDayTab !== 0 && activeDayTab !== di + 1) return null;
            return day.cards.map((card, ci) => {
              const cols = Math.min(day.cards.length, 3);
              const row = Math.floor(ci / cols);
              const col = ci % cols;
              const x = 60 + col * 100 + di * 20;
              const y = 60 + row * 90 + di * 15;
              const color = ['#3b82f6', '#10b981', '#f59e0b'][di];
              return (
                <div
                  key={card.id}
                  className="absolute flex flex-col items-center cursor-pointer hover:scale-110 transition-transform"
                  style={{ left: x - 16, top: y - 16, zIndex: 2 }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md"
                    style={{ backgroundColor: color }}
                  >
                    {di * day.cards.length + ci + 1}
                  </div>
                  <span className="text-[10px] text-gray-600 mt-0.5 bg-white/80 px-1 rounded max-w-[70px] truncate">
                    {card.name}
                  </span>
                </div>
              );
            });
          })}
          {/* Legend */}
          <div
            className="absolute bottom-3 left-3 bg-white/90 rounded-lg px-3 py-2 text-[10px] flex gap-3"
            style={{ zIndex: 3 }}
          >
            {trip.itinerary.map((d, i) => (
              <div key={i} className="flex items-center gap-1">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'][i] }}
                />
                <span className="text-gray-500">Day {d.dayIndex}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ============ TRIP PAGE ============
  const renderTrip = () => {
    if (!trip) return null;
    return (
      <div className="flex flex-col h-full bg-gray-50">
        {/* Header */}
        <div className="bg-white px-4 pt-10 pb-3 flex items-center justify-between border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPage('home')}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </button>
            <div>
              <h2 className="text-base font-bold text-gray-800">
                {trip.destination} {trip.days}日游
              </h2>
              <p className="text-xs text-gray-400">
                {trip.styleTags.map((t) => STYLES.find((s) => s.id === t)?.label).join(' · ')}
              </p>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
            >
              <MoreHorizontal className="w-4 h-4 text-gray-600" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-10 bg-white rounded-xl shadow-lg border border-gray-100 py-1 w-36 z-20">
                {[
                  { icon: Download, label: '导出长图' },
                  { icon: Share2, label: '分享给好友' },
                  { icon: Copy, label: '复制行程' },
                ].map(({ icon: Icon, label }) => (
                  <button
                    key={label}
                    onClick={() => setMenuOpen(false)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 flex items-center gap-2 hover:bg-gray-50 transition-colors"
                  >
                    <Icon className="w-4 h-4 text-gray-400" /> {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* View Toggle */}
        <div className="bg-white px-4 py-2 flex items-center gap-2 flex-shrink-0">
          {['timeline', 'map'].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                viewMode === mode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {mode === 'timeline' ? '时间轴' : '地图'}
            </button>
          ))}
        </div>

        {/* Content */}
        {viewMode === 'timeline' ? (
          <div className="flex-1 overflow-y-auto px-4 py-3 pb-24 space-y-4">
            {trip.itinerary.map((day, di) => {
              const collapsed = expandedDay !== null && expandedDay !== di;
              return (
                <div
                  key={di}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100"
                >
                  {/* Day Header */}
                  <button
                    onClick={() => setExpandedDay(expandedDay === di ? null : di)}
                    className="w-full flex items-center justify-between px-4 py-3"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-full ${dayColors[di]} flex items-center justify-center text-white text-xs font-bold`}
                      >
                        {day.dayIndex}
                      </div>
                      <span className="text-sm font-bold text-gray-800">Day {day.dayIndex}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{day.summary.spots}个景点</span>
                      <span>{day.summary.distance}</span>
                      <span>{day.summary.cost}</span>
                      {collapsed ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronUp className="w-4 h-4" />
                      )}
                    </div>
                  </button>
                  {/* Cards */}
                  {!collapsed && (
                    <div className="px-4 pb-3">
                      {day.cards.map((card, ci) => {
                        const Icon = typeIcon(card.type);
                        const isHighlighted = highlightedCards.includes(card.id);
                        return (
                          <div key={card.id}>
                            {card.transport && (
                              <div className="flex items-center gap-2 py-1.5 pl-7">
                                <div className="w-px h-4 bg-gray-200 ml-[9px]" />
                                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                                  <Navigation className="w-3 h-3" /> {card.transport}
                                </span>
                              </div>
                            )}
                            <button
                              onClick={() => {
                                setSelectedCard({
                                  ...card,
                                  transport: ci > 0 ? card.transport : null,
                                });
                                setChatOpen(false);
                              }}
                              className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all active:scale-[0.98] ${
                                isHighlighted
                                  ? 'bg-yellow-50 border border-yellow-300 ring-2 ring-yellow-200'
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${typeColor(card.type)}`}
                              >
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-gray-800 truncate">
                                    {card.name}
                                  </span>
                                  {card.starred && (
                                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                                  )}
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {card.time} · {card.price}
                                </p>
                                <p className="text-xs text-gray-500 mt-1 truncate">{card.desc}</p>
                              </div>
                              <div className="flex items-center gap-0.5 text-yellow-500 text-xs flex-shrink-0 mt-0.5">
                                <Star className="w-3 h-3 fill-yellow-500" />
                                {card.rating}
                              </div>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          renderMapView()
        )}

        {/* Chat FAB */}
        <button
          onClick={() => {
            setChatOpen(true);
            setSelectedCard(null);
          }}
          className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-300 flex items-center justify-center active:scale-95 transition-all z-30"
        >
          <MessageCircle className="w-6 h-6" />
        </button>

        {/* Overlays */}
        {renderCardDetail()}
        {renderChatPanel()}
      </div>
    );
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-4">
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
      {/* Phone Frame */}
      <div
        className="relative bg-white shadow-2xl"
        style={{
          width: 390,
          height: 760,
          borderRadius: 40,
          overflow: 'hidden',
          border: '8px solid #1a1a1a',
        }}
      >
        {/* Status Bar */}
        <div className="absolute top-0 left-0 right-0 h-12 z-50 flex items-end justify-between px-8 pb-1 bg-white/0 pointer-events-none">
          <span className="text-xs font-semibold text-gray-800">9:41</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-2.5 rounded-sm bg-gray-800" />
            <div className="w-3.5 h-3.5 rounded-full border border-gray-800 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-800" />
            </div>
          </div>
        </div>
        {/* Page Content */}
        <div className="h-full">
          {page === 'home' && renderHome()}
          {page === 'trip' && renderTrip()}
        </div>
      </div>
    </div>
  );
}
