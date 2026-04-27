import { useEffect, useState } from "react";
import "./App.css";

import cat1 from "./assets/cat1.webp";
import cat2 from "./assets/cat2.png";
import cat3 from "./assets/cat3.png";

const catSkins = [
  {
    id: 1,
    name: "Мурчик",
    image: cat1,
    price: 0,
  },
  {
    id: 2,
    name: "Сніжок",
    image: cat2,
    price: 3000,
  },
  {
    id: 3,
    name: "Піксель",
    image: cat3,
    price: 7000,
  },
];

const defaultState = {
  treats: 0,
  clickValue: 1,
  autoClick: 0,
  passiveIncome: 0,
  multiplier: 1,
  combo: 1,
  duiktcoins: 0,
  currentSkin: 1,
  unlockedSkins: [1],
  achievements: [],
  lastSave: Date.now(),
};

export default function App() {
  const [game, setGame] = useState(() => {
    const saved = localStorage.getItem("catClickerSave");

    if (saved) {
      const parsed = JSON.parse(saved);
      const secondsAway = Math.floor((Date.now() - parsed.lastSave) / 1000);
      const offlineIncome =
        secondsAway * ((parsed.autoClick || 0) + (parsed.passiveIncome || 0));

      return {
        ...defaultState,
        ...parsed,
        treats: parsed.treats + offlineIncome,
      };
    }

    return defaultState;
  });

  const [message, setMessage] = useState("Відкрий котячу коробку й отримай сюрприз!");
  const [clickBlocked, setClickBlocked] = useState(false);
  const [upgradeBlocked, setUpgradeBlocked] = useState(false);
  const [incomeBlocked, setIncomeBlocked] = useState(false);
  const [bonusActive, setBonusActive] = useState(false);
  const [popups, setPopups] = useState([]);

  const prestigeMultiplier = 1 + game.duiktcoins * 0.1;
  const activeCat = catSkins.find((cat) => cat.id === game.currentSkin);

  useEffect(() => {
    const saveData = {
      ...game,
      lastSave: Date.now(),
    };

    localStorage.setItem("catClickerSave", JSON.stringify(saveData));
  }, [game]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!incomeBlocked) {
        setGame((prev) => ({
          ...prev,
          treats:
            prev.treats +
            (prev.autoClick + prev.passiveIncome) * prestigeMultiplier,
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [incomeBlocked, prestigeMultiplier]);

  useEffect(() => {
    checkAchievements();
  }, [game.treats, game.unlockedSkins, game.duiktcoins]);

  const updateGame = (changes) => {
    setGame((prev) => ({
      ...prev,
      ...changes,
    }));
  };

  const handleClick = () => {
    if (clickBlocked) return;

    const earned =
      game.clickValue * game.multiplier * game.combo * prestigeMultiplier;

    updateGame({
      treats: game.treats + earned,
    });

    const popup = {
      id: Date.now(),
      text: `+${Math.floor(earned)} 🐟`,
      x: Math.random() * 80 + 10,
    };

    setPopups((prev) => [...prev, popup]);

    setTimeout(() => {
      setPopups((prev) => prev.filter((item) => item.id !== popup.id));
    }, 900);
  };

  const upgrades = [
    {
      icon: "🥣",
      name: "Більша миска",
      description: "+1 ласощі за клік",
      cost: 50,
      action: () => updateGame({ clickValue: game.clickValue + 1 }),
    },
    {
      icon: "🐾",
      name: "Автокотик",
      description: "Дає ласощі щосекунди",
      cost: 150,
      action: () => updateGame({ autoClick: game.autoClick + 1 }),
    },
    {
      icon: "🧶",
      name: "Клубок ниток",
      description: "+2 пасивного доходу",
      cost: 350,
      action: () => updateGame({ passiveIncome: game.passiveIncome + 2 }),
    },
    {
      icon: "✨",
      name: "Мур-множник",
      description: "Збільшує множник",
      cost: 700,
      action: () => updateGame({ multiplier: game.multiplier + 1 }),
    },
    {
      icon: "🐱",
      name: "Котяче комбо",
      description: "Підсилює combo",
      cost: 1200,
      action: () => updateGame({ combo: game.combo + 1 }),
    },
  ];

  const buyUpgrade = (upgrade) => {
    if (upgradeBlocked) {
      setMessage("🙀 Котик сховав апгрейди! Почекай трохи.");
      return;
    }

    if (game.treats >= upgrade.cost) {
      updateGame({
        treats: game.treats - upgrade.cost,
      });

      upgrade.action();
      setMessage(`💖 Куплено: ${upgrade.name}`);
    } else {
      setMessage("😿 Недостатньо ласощів!");
    }
  };

  const openCase = () => {
    if (game.treats < 150) {
      setMessage("😿 Для котячої коробки потрібно 150 ласощів!");
      return;
    }

    updateGame({
      treats: game.treats - 150,
    });

    const effects = ["bonusTreats", "doubleClick", "smallGift", "sleep", "vase", "hide"];
    const randomEffect = effects[Math.floor(Math.random() * effects.length)];

    if (randomEffect === "bonusTreats") {
      updateGame({ treats: game.treats + 150 });
      setMessage("🎁 Котик знайшов великий подарунок: +300 ласощів!");
    }

    if (randomEffect === "smallGift") {
      updateGame({ treats: game.treats });
      setMessage("🐟 Маленький подарунок: повернення 150 ласощів!");
    }

    if (randomEffect === "doubleClick") {
      setBonusActive(true);
      updateGame({ multiplier: game.multiplier * 2 });
      setMessage("✨ Котик замурчав! Множник x2 на 10 секунд!");

      setTimeout(() => {
        setGame((prev) => ({
          ...prev,
          multiplier: Math.max(1, prev.multiplier / 2),
        }));
        setBonusActive(false);
        setMessage("⏱ Мур-бонус завершився.");
      }, 10000);
    }

    if (randomEffect === "sleep") {
      setClickBlocked(true);
      setMessage("💤 Котик заснув. Клік заблоковано на 5 секунд.");

      setTimeout(() => {
        setClickBlocked(false);
        setMessage("🐱 Котик прокинувся! Можна клікати.");
      }, 5000);
    }

    if (randomEffect === "vase") {
      setUpgradeBlocked(true);
      setMessage("🏺 Котик розбив вазу. Апгрейди заблоковані на 7 секунд.");

      setTimeout(() => {
        setUpgradeBlocked(false);
        setMessage("🧹 Вазу прибрано. Апгрейди знову доступні.");
      }, 7000);
    }

    if (randomEffect === "hide") {
      setIncomeBlocked(true);
      setMessage("📦 Котик сховався в коробці. Пасивний дохід зупинено на 8 секунд.");

      setTimeout(() => {
        setIncomeBlocked(false);
        setMessage("🐾 Котик повернувся. Пасивний дохід працює.");
      }, 8000);
    }
  };

  const buySkin = (skin) => {
    if (game.unlockedSkins.includes(skin.id)) {
      updateGame({ currentSkin: skin.id });
      setMessage(`🐱 Обрано скін: ${skin.name}`);
      return;
    }

    if (game.treats >= skin.price) {
      updateGame({
        treats: game.treats - skin.price,
        unlockedSkins: [...game.unlockedSkins, skin.id],
        currentSkin: skin.id,
      });

      setMessage(`✨ Новий котик відкритий: ${skin.name}`);
    } else {
      setMessage("😿 Недостатньо ласощів для цього котика!");
    }
  };

  const prestige = () => {
    if (game.treats < 5000) {
      setMessage("Для престижу потрібно мінімум 5000 ласощів.");
      return;
    }

    const earnedCoins = Math.floor(game.treats / 5000);

    setGame({
      ...defaultState,
      duiktcoins: game.duiktcoins + earnedCoins,
      currentSkin: game.currentSkin,
      unlockedSkins: game.unlockedSkins,
      achievements: game.achievements,
    });

    setMessage(`🌟 Престиж виконано! Отримано ${earnedCoins} Duiktcoins.`);
  };

  const resetGame = () => {
    localStorage.removeItem("catClickerSave");
    setGame(defaultState);
    setMessage("Прогрес скинуто.");
  };

  const addAchievement = (achievement) => {
    if (!game.achievements.includes(achievement)) {
      setGame((prev) => ({
        ...prev,
        achievements: [...prev.achievements, achievement],
      }));
    }
  };

  const checkAchievements = () => {
    if (game.treats >= 1000) addAchievement("1000 ласощів");
    if (game.treats >= 5000) addAchievement("5000 ласощів");
    if (game.unlockedSkins.length >= 2) addAchievement("Перший новий котик");
    if (game.unlockedSkins.length >= 3) addAchievement("Колекціонер котиків");
    if (game.duiktcoins >= 1) addAchievement("Перший престиж");
  };

  return (
    <div className="app">
      <div className="blob blob-one"></div>
      <div className="blob blob-two"></div>

      <header className="hero">
        <p className="badge">React + Vite Cat Clicker</p>
        <h1>🐱 Cat Treat Clicker</h1>
        <p className="subtitle">
          Клікай на котика, збирай ласощі, купуй апгрейди та відкривай нові скіни
        </p>
      </header>

      <section className="card main-card">
        <p className="label">Котячий баланс</p>
        <h2>{Math.floor(game.treats)} ласощів 🐟</h2>
        <p className="duikt">Duiktcoins: {game.duiktcoins} | бонус доходу: x{prestigeMultiplier.toFixed(1)}</p>

        <div className="cat-area">
          {popups.map((popup) => (
            <span key={popup.id} className="popup" style={{ left: `${popup.x}%` }}>
              {popup.text}
            </span>
          ))}

          <button
            className={clickBlocked ? "cat-btn blocked" : "cat-btn"}
            onClick={handleClick}
          >
            <img src={activeCat.image} alt={activeCat.name} />
          </button>
        </div>

        <p className="active-skin">Активний котик: {activeCat.name}</p>

        <div className="stats-grid">
          <div>
            <span>+{game.clickValue}</span>
            <p>за клік</p>
          </div>
          <div>
            <span>x{game.multiplier}</span>
            <p>множник</p>
          </div>
          <div>
            <span>{game.combo}</span>
            <p>combo</p>
          </div>
          <div>
            <span>{game.autoClick + game.passiveIncome}/с</span>
            <p>дохід</p>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Милі апгрейди</h2>

        <div className="upgrades">
          {upgrades.map((upgrade, index) => (
            <button
              key={index}
              onClick={() => buyUpgrade(upgrade)}
              disabled={upgradeBlocked}
              className="upgrade-card"
            >
              <span className="upgrade-icon">{upgrade.icon}</span>
              <strong>{upgrade.name}</strong>
              <small>{upgrade.description}</small>
              <b>{upgrade.cost} 🐟</b>
            </button>
          ))}
        </div>
      </section>

      <section className="card skins-card">
        <h2>🐾 Скіни котиків</h2>

        <div className="skins">
          {catSkins.map((skin) => (
            <button
              key={skin.id}
              className={game.currentSkin === skin.id ? "skin active" : "skin"}
              onClick={() => buySkin(skin)}
            >
              <img src={skin.image} alt={skin.name} />
              <strong>{skin.name}</strong>
              <span>
                {game.unlockedSkins.includes(skin.id)
                  ? "Відкрито"
                  : `${skin.price} 🐟`}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="card case-card">
        <h2>🎁 Котяча коробка</h2>
        <p>Вартість коробки: 150 ласощів</p>

        <button className="case-btn" onClick={openCase}>
          Відкрити коробку
        </button>

        <p className={bonusActive ? "message bonus" : "message"}>{message}</p>
      </section>

      <section className="card prestige-card">
        <h2>🌟 Престиж</h2>
        <p>
          Скинь основний прогрес і отримай Duiktcoins.  
          1 Duiktcoin дає +10% до доходу.
        </p>
        <button className="prestige-btn" onClick={prestige}>
          Виконати престиж
        </button>
        <button className="reset-btn" onClick={resetGame}>
          Скинути гру
        </button>
      </section>

      <section className="card achievements-card">
        <h2>🏆 Досягнення</h2>

        {game.achievements.length === 0 ? (
          <p>Поки що немає досягнень.</p>
        ) : (
          <div className="achievements">
            {game.achievements.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        )}
      </section>

      <section className="card status-card">
        <h2>Стан котика</h2>

        <div className="status-list">
          <p className={clickBlocked ? "danger" : "success"}>
            Клік: {clickBlocked ? "котик спить" : "активний"}
          </p>
          <p className={upgradeBlocked ? "danger" : "success"}>
            Апгрейди: {upgradeBlocked ? "заблоковані" : "доступні"}
          </p>
          <p className={incomeBlocked ? "danger" : "success"}>
            Пасивний дохід: {incomeBlocked ? "зупинено" : "активний"}
          </p>
        </div>
      </section>
    </div>
  );
}