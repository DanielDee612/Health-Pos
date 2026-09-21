import React, { useState, useMemo } from "react";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Search,
  Tag,
  Store,
  BarChart3,
  Receipt,
  Download,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function POSSystem() {
  // --- System State ---
  const [activeTab, setActiveTab] = useState("pos"); // 'pos' = Cashier, 'dashboard' = Reports
  const [salesHistory, setSalesHistory] = useState([]); // Stores all checkout records

  // --- Mock Database ---
  const [inventory] = useState([
    {
      id: "SM10-01",
      name: "Samai 泰國凍乾生果 – 芒果 (10g)",
      price: 22,
      stock: 0,
      category: "凍乾生果 10g",
    },
    {
      id: "SM10-02",
      name: "Samai 泰國凍乾生果 – 紅毛丹 (10g)",
      price: 23,
      stock: 0,
      category: "凍乾生果 10g",
    },
    {
      id: "SM10-03",
      name: "Samai 泰國凍乾生果 – 山竹 (10g)",
      price: 23,
      stock: 0,
      category: "凍乾生果 10g",
    },
    {
      id: "SM25-01",
      name: "Samai 泰國凍乾生果 – 芒果 (25g)",
      price: 39,
      stock: 50,
      category: "凍乾生果 25g",
    },
    {
      id: "SM-SET",
      name: "Samai 泰國凍乾生果 – 套裝",
      price: 238,
      stock: 16,
      category: "套裝",
    },
    {
      id: "VIN-01",
      name: "《微醺賓尼》荔枝陸拾—荔枝醋",
      price: 168,
      stock: 36,
      category: "酒類及醋",
    },
    {
      id: "W300-01",
      name: "茶王梅酒 (300ml)",
      price: 108,
      stock: 50,
      category: "酒類及醋",
    },
    {
      id: "W300-06",
      name: "玫瑰梅酒 (300ml)",
      price: 128,
      stock: 50,
      category: "酒類及醋",
    },
    {
      id: "W700-01",
      name: "茶王梅酒 (700ml)",
      price: 208,
      stock: 50,
      category: "酒類及醋",
    },
  ]);

  const categories = [
    "全部",
    ...new Set(inventory.map((item) => item.category)),
  ];

  // --- POS State ---
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [customItemName, setCustomItemName] = useState("臨時收費 / 膠袋");
  const [customItemPrice, setCustomItemPrice] = useState("");

  // --- POS Functions ---
  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const addCustomItem = () => {
    if (!customItemPrice || isNaN(customItemPrice)) return;
    const newItem = {
      id: `CUSTOM-${Date.now()}`,
      name: customItemName || "未命名收費",
      price: Number(customItemPrice),
      quantity: 1,
    };
    addToCart(newItem);
    setCustomItemPrice("");
  };

  const updateCartItemPrice = (id, newPrice) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id ? { ...item, price: Number(newPrice) } : item
      )
    );
  };

  const updateQuantity = (id, amount) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.id === id) {
          const newQuantity = item.quantity + amount;
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
        }
        return item;
      })
    );
  };

  const removeItem = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Checkout and record to dashboard
  const handleCheckout = () => {
    const newOrder = {
      id: `ORD-${Date.now()}`,
      time: new Date().toLocaleString(),
      items: [...cart],
      total: totalAmount,
    };

    setSalesHistory([...salesHistory, newOrder]);
    alert(`成功結帳！總共收費 $${totalAmount}`);
    setCart([]);
  };

  const filteredInventory = inventory.filter((item) => {
    const matchCategory =
      selectedCategory === "全部" || item.category === selectedCategory;
    const matchSearch = item.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  // --- Dashboard Data Calculation ---
  const dashboardStats = useMemo(() => {
    let totalRevenue = 0;
    let totalItemsSold = 0;
    const itemSalesMap = {};

    salesHistory.forEach((order) => {
      totalRevenue += order.total;
      order.items.forEach((item) => {
        totalItemsSold += item.quantity;
        if (itemSalesMap[item.name]) {
          itemSalesMap[item.name].quantity += item.quantity;
          itemSalesMap[item.name].revenue += item.price * item.quantity;
        } else {
          itemSalesMap[item.name] = {
            name: item.name,
            quantity: item.quantity,
            revenue: item.price * item.quantity,
          };
        }
      });
    });

    const topSellingItems = Object.values(itemSalesMap).sort(
      (a, b) => b.quantity - a.quantity
    );
    return { totalRevenue, totalItemsSold, topSellingItems };
  }, [salesHistory]);

  // --- Export to CSV (Excel Compatible) ---
  const exportToCSV = () => {
    if (salesHistory.length === 0) {
      alert("目前沒有任何銷售紀錄可以匯出！");
      return;
    }

    // CSV Headers
    let csvContent = "訂單編號,交易時間,貨品名稱,單價,數量,小計,該單總額\n";

    // Fill data
    salesHistory.forEach((order) => {
      order.items.forEach((item, index) => {
        const safeName = `"${item.name.replace(/"/g, '""')}"`;
        const subtotal = item.price * item.quantity;

        if (index === 0) {
          csvContent += `${order.id},${order.time},${safeName},${item.price},${item.quantity},${subtotal},${order.total}\n`;
        } else {
          csvContent += `,,${safeName},${item.price},${item.quantity},${subtotal},\n`;
        }
      });
    });

    // Add UTF-8 BOM so Excel reads Chinese characters correctly
    const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
    const blob = new Blob([bom, csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);

    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("download", `銷售報表_${dateStr}.csv`);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- UI Render ---
  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
      {/* Top Navigation */}
      <div className="bg-white shadow-sm p-4 flex justify-center space-x-4">
        <button
          onClick={() => setActiveTab("pos")}
          className={`flex items-center px-6 py-2 rounded-lg font-bold transition-colors ${
            activeTab === "pos"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          <Store className="mr-2" size={20} /> 收銀台 (POS)
        </button>
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex items-center px-6 py-2 rounded-lg font-bold transition-colors ${
            activeTab === "dashboard"
              ? "bg-purple-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          <BarChart3 className="mr-2" size={20} /> 後台報表
        </button>
      </div>

      <div className="p-4 md:p-8 flex-grow">
        {/* ================= POS Interface ================= */}
        {activeTab === "pos" && (
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Inventory List */}
            <div className="bg-white p-6 rounded-xl shadow-md flex flex-col h-[80vh]">
              <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center">
                📦 貨物清單
              </h2>

              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="text-gray-400" size={20} />
                </div>
                <input
                  type="text"
                  placeholder="搜尋貨品名稱..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="flex-grow overflow-y-auto space-y-3 pr-2">
                {filteredInventory.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <h3 className="font-semibold text-gray-800 text-sm md:text-base">
                        {item.name}
                      </h3>
                      <div className="text-sm mt-1 text-red-500 font-bold">
                        ${item.price}
                      </div>
                    </div>
                    <button
                      onClick={() => addToCart(item)}
                      className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 flex items-center flex-shrink-0 ml-2"
                    >
                      <Plus size={16} className="mr-1" /> 加入
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Shopping Cart */}
            <div className="bg-white p-6 rounded-xl shadow-md flex flex-col h-[80vh]">
              <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center border-b pb-2">
                <ShoppingCart className="mr-2" /> 購物車
              </h2>

              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="text-sm font-bold text-yellow-800 mb-2 flex items-center">
                  <Tag size={16} className="mr-1" /> 自訂臨時收費
                </h3>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={customItemName}
                    onChange={(e) => setCustomItemName(e.target.value)}
                    placeholder="項目名稱"
                    className="flex-grow p-2 border rounded text-sm"
                  />
                  <div className="flex items-center bg-white border rounded px-2">
                    <span className="text-gray-500 mr-1">$</span>
                    <input
                      type="number"
                      value={customItemPrice}
                      onChange={(e) => setCustomItemPrice(e.target.value)}
                      placeholder="價錢"
                      className="w-16 p-1 focus:outline-none text-sm"
                    />
                  </div>
                  <button
                    onClick={addCustomItem}
                    className="bg-yellow-500 text-white px-3 py-2 rounded font-bold text-sm"
                  >
                    加入
                  </button>
                </div>
              </div>

              <div className="flex-grow overflow-y-auto space-y-3 pr-2">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col p-3 border rounded-lg bg-blue-50"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-gray-800 text-sm">
                        {item.name}
                      </span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 p-1"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <div className="flex items-center bg-white border rounded px-2 py-1">
                        <span className="text-gray-600 mr-1 text-sm">$</span>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) =>
                            updateCartItemPrice(item.id, e.target.value)
                          }
                          className="w-16 text-red-600 font-bold focus:outline-none text-sm"
                        />
                      </div>
                      <div className="flex items-center space-x-2 bg-white border rounded-lg p-1">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="p-1"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="font-bold w-6 text-center text-sm">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="p-1"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t-2 border-gray-200 shrink-0">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xl font-bold text-gray-600">總計:</span>
                  <span className="text-3xl font-bold text-red-600">
                    ${totalAmount}
                  </span>
                </div>
                <button
                  className="w-full bg-green-500 text-white py-3 rounded-xl font-bold text-lg hover:bg-green-600 disabled:bg-gray-300"
                  disabled={cart.length === 0}
                  onClick={handleCheckout}
                >
                  確認結帳
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= Dashboard Interface ================= */}
        {activeTab === "dashboard" && (
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Top Stats & Download */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
              <h2 className="text-xl font-bold text-gray-800">
                📊 銷售數據總覽
              </h2>
              <button
                onClick={exportToCSV}
                className="flex items-center bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-700 transition-colors"
              >
                <Download size={18} className="mr-2" /> 下載報表 (Excel)
              </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500">
                <h3 className="text-gray-500 text-sm font-bold mb-1">
                  總營業額 (賺咗幾多錢)
                </h3>
                <p className="text-3xl font-bold text-gray-800">
                  ${dashboardStats.totalRevenue}
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
                <h3 className="text-gray-500 text-sm font-bold mb-1">
                  總賣出數量 (賣咗幾多貨)
                </h3>
                <p className="text-3xl font-bold text-gray-800">
                  {dashboardStats.totalItemsSold} 件
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
                <h3 className="text-gray-500 text-sm font-bold mb-1">
                  總訂單數
                </h3>
                <p className="text-3xl font-bold text-gray-800">
                  {salesHistory.length} 單
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Selling Chart */}
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <BarChart3 className="mr-2" size={20} /> 貨品銷量排行
                </h3>
                {dashboardStats.topSellingItems.length === 0 ? (
                  <p className="text-gray-400 text-center py-10">
                    尚無銷售紀錄
                  </p>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={dashboardStats.topSellingItems.slice(0, 5)}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          horizontal={false}
                        />
                        <XAxis type="number" />
                        <YAxis
                          dataKey="name"
                          type="category"
                          width={150}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip />
                        <Bar
                          dataKey="quantity"
                          fill="#8884d8"
                          name="賣出數量"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Order History */}
              <div className="bg-white p-6 rounded-xl shadow-md flex flex-col h-80">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <Receipt className="mr-2" size={20} /> 最新訂單紀錄
                </h3>
                <div className="flex-grow overflow-y-auto space-y-3 pr-2">
                  {salesHistory.length === 0 ? (
                    <p className="text-gray-400 text-center py-10">
                      尚無訂單紀錄
                    </p>
                  ) : (
                    [...salesHistory].reverse().map((order) => (
                      <div
                        key={order.id}
                        className="p-3 border rounded-lg bg-gray-50"
                      >
                        <div className="flex justify-between items-center mb-2 border-b pb-2">
                          <span className="text-xs text-gray-500">
                            {order.time}
                          </span>
                          <span className="font-bold text-red-600">
                            ${order.total}
                          </span>
                        </div>
                        <ul className="text-sm text-gray-700 space-y-1">
                          {order.items.map((item, idx) => (
                            <li key={idx} className="flex justify-between">
                              <span className="truncate pr-2">{item.name}</span>
                              <span className="whitespace-nowrap">
                                x {item.quantity}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
