import React, { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  arrayUnion,
  increment,
  deleteDoc,
} from "firebase/firestore";
import {
  Banana,
  Grape,
  Citrus,
  Apple,
  Cherry,
  Trophy,
  Skull,
  Play,
  LogOut,
  RotateCcw,
  User,
  CheckCircle,
  X,
  History,
  Info,
  BookOpen,
  ArrowRight,
  Hand,
  AlertTriangle,
  Hammer,
  Sparkles,
  Home,
  Trash2,
} from "lucide-react";

// --- Firebase Config & Init ---
const firebaseConfig = {
  apiKey: "AIzaSyBjIjK53vVJW1y5RaqEFGSFp0ECVDBEe1o",
  authDomain: "game-hub-ff8aa.firebaseapp.com",
  projectId: "game-hub-ff8aa",
  storageBucket: "game-hub-ff8aa.firebasestorage.app",
  messagingSenderId: "586559578902",
  appId: "1:586559578902:web:c447da22d85544e16aa637",
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const APP_ID = typeof __app_id !== "undefined" ? __app_id : "fructose-fury";
const GAME_ID = "20"; // Assigned ID for Fructose Fury

// --- Game Constants ---
const FRUITS = {
  BANANA: {
    name: "Banana",
    val: 4,
    color: "text-yellow-400",
    bg: "bg-yellow-900/50",
    border: "border-yellow-500",
    icon: Banana,
  },
  GRAPE: {
    name: "Grape",
    val: 3,
    color: "text-purple-400",
    bg: "bg-purple-900/50",
    border: "border-purple-500",
    icon: Grape,
  },
  CITRUS: {
    name: "Tangerine",
    val: 2,
    color: "text-orange-400",
    bg: "bg-orange-900/50",
    border: "border-orange-500",
    icon: Citrus,
  },
  APPLE: {
    name: "Peach",
    val: 3,
    color: "text-pink-400",
    bg: "bg-pink-900/50",
    border: "border-pink-500",
    icon: Apple,
  },
  CHERRY: {
    name: "Strawberry",
    val: 1,
    color: "text-red-400",
    bg: "bg-red-900/50",
    border: "border-red-500",
    icon: Cherry,
  },
};

// 90 Cards Total (18 of each)
const DECK_TEMPLATE = [];
Object.keys(FRUITS).forEach((type) => {
  for (let i = 0; i < 18; i++) {
    DECK_TEMPLATE.push(type);
  }
});

// --- Helper Functions ---
const shuffle = (array) => {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
};

// --- Visual Components ---

const FloatingBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-900/20 via-gray-950 to-black" />
    <div className="absolute top-0 left-0 w-full h-full opacity-10">
      {[...Array(20)].map((_, i) => {
        const Icon = Object.values(FRUITS)[i % 5].icon;
        return (
          <div
            key={i}
            className="absolute animate-float text-white/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${10 + Math.random() * 20}s`,
              transform: `scale(${0.5 + Math.random()})`,
            }}
          >
            <Icon size={32} />
          </div>
        );
      })}
    </div>
    <style>{`
      @keyframes float {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-20px) rotate(10deg); }
      }
      .animate-float { animation: float infinite ease-in-out; }
    `}</style>
  </div>
);

const Card = ({ type, size = "md", animate = false }) => {
  const fruit = FRUITS[type];
  if (!fruit) return <div className="w-16 h-24 bg-gray-800 rounded-lg"></div>;

  const sizeClasses =
    size === "sm"
      ? "w-10 h-14 md:w-12 md:h-16 p-1"
      : size === "lg"
      ? "w-32 h-48 p-4"
      : "w-20 h-28 md:w-24 md:h-32 p-2";

  const Icon = fruit.icon;

  return (
    <div
      className={`
      ${sizeClasses} rounded-xl border-2 ${fruit.bg} ${fruit.border} 
      flex flex-col items-center justify-center shadow-lg relative overflow-hidden
      ${animate ? "animate-in zoom-in duration-300" : ""}
    `}
    >
      <div className="absolute -right-2 -top-2 opacity-20 rotate-12">
        <Icon size={size === "lg" ? 80 : 40} />
      </div>
      <Icon
        className={`${fruit.color} drop-shadow-md z-10`}
        size={size === "sm" ? 20 : size === "lg" ? 64 : 32}
      />
      {size !== "sm" && (
        <span
          className={`font-bold uppercase tracking-wider text-[10px] md:text-xs mt-2 text-white/90 z-10 text-center leading-none`}
        >
          {fruit.name}
        </span>
      )}
      {size === "lg" && (
        <span className="absolute bottom-2 right-2 text-white/50 text-xs font-mono">
          {fruit.val}pts
        </span>
      )}
    </div>
  );
};

// --- Modal Components ---

const StealModal = ({ targetName, fruitType, onSteal, onPass }) => (
  <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 animate-in fade-in">
    <div className="bg-gray-800 rounded-2xl border-4 border-yellow-500 p-6 max-w-md w-full text-center shadow-[0_0_50px_rgba(234,179,8,0.3)] relative overflow-hidden">
      <div className="absolute inset-0 bg-yellow-500/10 animate-pulse pointer-events-none" />
      <div className="relative z-10">
        <h3 className="text-3xl font-black text-white mb-2 uppercase italic transform -rotate-2">
          Sweet Opportunity!
        </h3>
        <p className="text-gray-300 mb-6 text-lg">
          You drew a{" "}
          <strong className="text-yellow-400">{FRUITS[fruitType].name}</strong>!
          <br />
          <span className="text-white font-bold">{targetName}</span> has them
          sitting in their danger zone.
        </p>

        <div className="flex justify-center mb-8">
          <Card type={fruitType} size="lg" animate />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={onPass}
            className="bg-gray-700 hover:bg-gray-600 text-gray-300 py-4 rounded-xl font-bold transition-all"
          >
            Leave Them Be
          </button>
          <button
            onClick={onSteal}
            className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white py-4 rounded-xl font-black text-xl shadow-lg transform hover:scale-105 transition-all flex items-center justify-center gap-2"
          >
            <Hand /> STEAL ALL!
          </button>
        </div>
      </div>
    </div>
  </div>
);

const BustModal = ({ onConfirm }) => (
  <div className="fixed inset-0 bg-red-900/90 z-[100] flex items-center justify-center p-4 animate-in zoom-in duration-300">
    <div className="text-center">
      <Skull size={120} className="text-white mx-auto mb-6 animate-bounce" />
      <h1 className="text-6xl md:text-8xl font-black text-white mb-4 drop-shadow-[0_5px_5px_rgba(0,0,0,1)] uppercase tracking-tighter">
        BUSTED!
      </h1>
      <p className="text-2xl text-red-200 mb-8 font-bold">
        Too greedy! All fruits lost.
      </p>
      <button
        onClick={onConfirm}
        className="bg-white text-red-900 px-8 py-4 rounded-full font-black text-xl hover:scale-110 transition-transform shadow-2xl"
      >
        Darn it!
      </button>
    </div>
  </div>
);

const LeaveConfirmModal = ({
  onConfirm,
  onCancel,
  isHost,
  onReturnToLobby,
}) => (
  <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4 animate-in fade-in">
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-sm w-full text-center shadow-2xl">
      <h3 className="text-xl font-bold text-white mb-2">
        Abandon the Harvest?
      </h3>
      <p className="text-gray-400 mb-6 text-sm">
        Leaving now will forfeit your gathered fruits.
      </p>
      <div className="flex flex-col gap-3">
        {isHost && onReturnToLobby && (
          <button
            onClick={onReturnToLobby}
            className="w-full bg-orange-700 hover:bg-orange-600 text-white py-3 rounded font-bold transition-colors border border-orange-500 shadow-lg mb-2"
          >
            Return Group to Lobby
          </button>
        )}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            className="bg-gray-700 hover:bg-gray-600 text-white py-3 rounded font-bold transition-colors"
          >
            Stay
          </button>
          <button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-500 text-white py-3 rounded font-bold transition-colors"
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  </div>
);

const GameGuideModal = ({ onClose }) => (
  <div className="fixed inset-0 bg-black/95 z-[150] flex items-center justify-center p-0 md:p-4">
    <div className="bg-gray-900 md:rounded-2xl w-full max-w-3xl h-full md:h-auto md:max-h-[90vh] overflow-hidden border border-yellow-500/30 flex flex-col">
      <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-950">
        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 uppercase italic">
          How to Play
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-800 rounded-full text-gray-400"
        >
          <X />
        </button>
      </div>
      <div className="p-6 overflow-y-auto space-y-6 text-gray-300">
        <div className="flex gap-4 items-start">
          <div className="bg-yellow-500/20 p-3 rounded-lg text-yellow-500">
            <Play size={24} />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">1. Push Your Luck</h3>
            <p className="text-sm">
              Draw fruits from the deck one by one. They go into your{" "}
              <strong className="text-red-400">Risk Zone</strong>. Try to
              collect as many as possible without busting!
            </p>
          </div>
        </div>

        <div className="flex gap-4 items-start">
          <div className="bg-red-500/20 p-3 rounded-lg text-red-500">
            <Skull size={24} />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">2. Don't Bust</h3>
            <p className="text-sm">
              If you draw a fruit that matches one <em>already</em> in your Risk
              Zone, you <strong>BUST</strong>! All fruits from this turn are
              discarded.
            </p>
          </div>
        </div>

        <div className="flex gap-4 items-start">
          <div className="bg-orange-500/20 p-3 rounded-lg text-orange-500">
            <Hand size={24} />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">3. Steal!</h3>
            <p className="text-sm">
              If you draw a fruit that an opponent has in their{" "}
              <strong className="text-orange-400">Danger Zone</strong> (Table),
              you can <strong>STEAL</strong> them! They are added to your Risk
              Zone (increasing your reward, but risking a bigger bust).
            </p>
          </div>
        </div>

        <div className="flex gap-4 items-start">
          <div className="bg-green-500/20 p-3 rounded-lg text-green-500">
            <CheckCircle size={24} />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">4. Bank & Win</h3>
            <p className="text-sm">
              If you stop before busting, your fruits move to your{" "}
              <strong>Danger Zone</strong>. At the start of your <em>next</em>{" "}
              turn, they move to your <strong>Safe Zone</strong> (Bank) and
              become points.
              <br />
              <br />
              When the deck runs out, the player with the most fruits wins!
            </p>
          </div>
        </div>
      </div>
      <div className="p-4 bg-gray-900 border-t border-gray-800 text-center">
        <button
          onClick={onClose}
          className="bg-yellow-600 hover:bg-yellow-500 text-white px-8 py-3 rounded-lg font-bold"
        >
          Got it!
        </button>
      </div>
    </div>
  </div>
);

// --- Main Game Component ---

export default function FructoseFury() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("menu");
  const [playerName, setPlayerName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);

  // Local UI States
  const [showGuide, setShowGuide] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showLogHistory, setShowLogHistory] = useState(false);
  const [bustAnimation, setBustAnimation] = useState(false);

  // --- Auth & Maintenance ---
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== "undefined" && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "game_hub_settings", "config"), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data[GAME_ID]?.maintenance) {
          setIsMaintenance(true);
        } else {
          setIsMaintenance(false);
        }
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!roomId || !user) return;
    const unsub = onSnapshot(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setGameState(data);

          if (data.status === "playing" || data.status === "finished") {
            setView("game");
          } else if (data.status === "lobby") {
            setView("lobby");
          }
        } else {
          setRoomId("");
          setView("menu");
          setError("The Fruit Stand has closed (Room deleted).");
        }
      }
    );
    return () => unsub();
  }, [roomId, user]);

  // --- Logic Functions ---

  const createRoom = async () => {
    if (!playerName) return setError("Name required");
    setLoading(true);
    const newId = Math.random().toString(36).substring(2, 7).toUpperCase();

    // Initial Deck
    const deck = shuffle([...DECK_TEMPLATE]);

    const initialData = {
      roomId: newId,
      hostId: user.uid,
      status: "lobby",
      players: [
        {
          id: user.uid,
          name: playerName,
          hand: [], // Risk Zone (Active Turn)
          table: [], // Danger Zone (Waiting to Bank)
          bank: [], // Safe Zone (Score)
          ready: false,
        },
      ],
      deck: deck,
      turnIndex: 0,
      turnPhase: "IDLE", // IDLE, DRAWING, STEALING
      stealTargetId: null, // If stealing phase active
      drawnCard: null, // The card just drawn
      logs: [],
    };

    await setDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", newId),
      initialData
    );
    setRoomId(newId);
    setRoomCodeInput(newId);
    setLoading(false);
  };

  const joinRoom = async () => {
    if (!roomCodeInput || !playerName)
      return setError("Code and Name required");
    setLoading(true);
    const ref = doc(
      db,
      "artifacts",
      APP_ID,
      "public",
      "data",
      "rooms",
      roomCodeInput
    );
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      setError("Room not found");
      setLoading(false);
      return;
    }

    const data = snap.data();
    if (data.status !== "lobby") {
      setError("Game already started");
      setLoading(false);
      return;
    }

    if (data.players.length >= 6) {
      setError("Room full");
      setLoading(false);
      return;
    }

    if (!data.players.find((p) => p.id === user.uid)) {
      await updateDoc(ref, {
        players: arrayUnion({
          id: user.uid,
          name: playerName,
          hand: [],
          table: [],
          bank: [],
          ready: false,
        }),
      });
    }
    setRoomId(roomCodeInput);
    setLoading(false);
  };

  const startGame = async () => {
    if (gameState.hostId !== user.uid) return;
    // Shuffle deck again just in case
    const deck = shuffle([...DECK_TEMPLATE]);

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        status: "playing",
        deck,
        turnIndex: 0,
        turnPhase: "DRAWING",
        logs: [
          {
            text: "The Harvest Begins! Draw fruits without busting.",
            type: "neutral",
          },
        ],
      }
    );
  };

  const resetToLobby = async () => {
    if (gameState.hostId !== user.uid) return;
    const players = gameState.players.map((p) => ({
      ...p,
      hand: [],
      table: [],
      bank: [],
      ready: false,
    }));

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        status: "lobby",
        players,
        deck: shuffle([...DECK_TEMPLATE]),
        logs: [],
        turnIndex: 0,
      }
    );
    setShowLeaveConfirm(false);
  };

  const leaveRoom = async () => {
    if (!roomId) return;
    const ref = doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId);

    if (gameState.players.length <= 1) {
      await deleteDoc(ref);
    } else {
      const newPlayers = gameState.players.filter((p) => p.id !== user.uid);
      let newStatus = gameState.status;
      if (gameState.status === "playing" && newPlayers.length < 2) {
        newStatus = "finished";
      }

      await updateDoc(ref, {
        players: newPlayers,
        status: newStatus,
        logs: arrayUnion({
          text: `${playerName} left the game.`,
          type: "danger",
        }),
      });
    }
    setRoomId("");
    setView("menu");
    setShowLeaveConfirm(false);
  };

  const nextTurn = async (currentPlayers, currentDeck, logs = []) => {
    let nextIdx = (gameState.turnIndex + 1) % currentPlayers.length;

    // Auto-Bank for the NEXT player
    const nextPlayer = currentPlayers[nextIdx];
    if (nextPlayer.table.length > 0) {
      const bankedCount = nextPlayer.table.length;
      nextPlayer.bank = [...nextPlayer.bank, ...nextPlayer.table];
      nextPlayer.table = [];
      logs.push({
        text: `${nextPlayer.name} banked ${bankedCount} fruits!`,
        type: "success",
      });
    }

    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        players: currentPlayers,
        deck: currentDeck,
        turnIndex: nextIdx,
        turnPhase: "DRAWING",
        drawnCard: null,
        stealTargetId: null,
        logs: arrayUnion(...logs),
      }
    );
  };

  const handleDraw = async () => {
    if (gameState.deck.length === 0) return; // Game Over trigger usually handled elsewhere, but safe guard

    const players = [...gameState.players];
    const deck = [...gameState.deck];
    const me = players[gameState.turnIndex];
    const cardType = deck.pop();

    // Check Bust
    const hasMatchInHand = me.hand.includes(cardType);

    if (hasMatchInHand) {
      // BUST LOGIC
      me.hand = []; // Discard hand
      const logs = [
        {
          text: `${me.name} drew a ${FRUITS[cardType].name} and BUSTED!`,
          type: "danger",
        },
      ];

      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        {
          players,
          deck,
          logs: arrayUnion(...logs),
          drawnCard: cardType, // Briefly show what killed them?
        }
      );

      // Trigger visual bust locally for everyone (via snapshot update) but we can't easily animate for all.
      // We'll rely on the log and state change.
      // Delay next turn slightly for visual effect
      setTimeout(() => nextTurn(players, deck), 2000);
    } else {
      // Check Steal Opportunity
      let stealTarget = null;

      // Find first player who has this card in their TABLE (Danger Zone)
      // We prioritize the player with the MOST of that card? Or just first found?
      // Usually you steal ALL matching cards.
      // Let's check if ANYONE has it.
      for (let p of players) {
        if (p.id !== me.id && p.table.includes(cardType)) {
          stealTarget = p.id;
          break; // Found a victim
        }
      }

      if (stealTarget) {
        // Steal Phase
        await updateDoc(
          doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
          {
            deck, // Card is technically drawn but held in limbo or handled?
            // Wait, we need to show the card. Let's add it to hand temporarily or hold it in 'drawnCard'
            drawnCard: cardType,
            turnPhase: "STEALING",
            stealTargetId: stealTarget,
          }
        );
      } else {
        // Safe Draw
        me.hand.push(cardType);

        // End game check?
        if (deck.length === 0) {
          await updateDoc(
            doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
            {
              players,
              deck,
              status: "finished",
              logs: arrayUnion({
                text: "Deck Empty! Game Over!",
                type: "neutral",
              }),
            }
          );
        } else {
          await updateDoc(
            doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
            {
              players,
              deck,
            }
          );
        }
      }
    }
  };

  const handleSteal = async (doSteal) => {
    const players = [...gameState.players];
    const meIdx = gameState.turnIndex;
    const me = players[meIdx];
    const targetIdx = players.findIndex(
      (p) => p.id === gameState.stealTargetId
    );
    const target = players[targetIdx];
    const cardType = gameState.drawnCard;

    const logs = [];

    // Add the drawn card to hand regardless
    me.hand.push(cardType);

    if (doSteal) {
      // Move matching cards from target table to my hand
      const stolenCards = target.table.filter((c) => c === cardType);
      const remainingTable = target.table.filter((c) => c !== cardType);

      target.table = remainingTable;
      me.hand = [...me.hand, ...stolenCards];

      logs.push({
        text: `${me.name} stole ${stolenCards.length} ${FRUITS[cardType].name}(s) from ${target.name}!`,
        type: "warning",
      });
    } else {
      logs.push({
        text: `${me.name} passed on stealing ${FRUITS[cardType].name}.`,
        type: "neutral",
      });
    }

    // Check if deck empty (GAME OVER condition check after this action)
    if (gameState.deck.length === 0) {
      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        {
          players,
          status: "finished",
          logs: arrayUnion(...logs, {
            text: "Deck Empty! Game Over!",
            type: "neutral",
          }),
        }
      );
    } else {
      await updateDoc(
        doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
        {
          players,
          turnPhase: "DRAWING",
          stealTargetId: null,
          drawnCard: null,
          logs: arrayUnion(...logs),
        }
      );
    }
  };

  const handleStop = async () => {
    const players = [...gameState.players];
    const me = players[gameState.turnIndex];

    // Move Hand -> Table
    me.table = [...me.table, ...me.hand];
    me.hand = [];

    const logs = [
      {
        text: `${me.name} stopped. Fruits moved to Danger Zone.`,
        type: "neutral",
      },
    ];

    await nextTurn(players, gameState.deck, logs);
  };

  const toggleReady = async () => {
    if (!roomId) return;
    const players = [...gameState.players];
    const myIdx = players.findIndex((p) => p.id === user.uid);
    players[myIdx].ready = !players[myIdx].ready;
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        players,
      }
    );
  };

  const kickPlayer = async (pid) => {
    const players = gameState.players.filter((p) => p.id !== pid);
    await updateDoc(
      doc(db, "artifacts", APP_ID, "public", "data", "rooms", roomId),
      {
        players,
      }
    );
  };

  // --- Render Helpers ---

  if (isMaintenance) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white p-4 text-center">
        <div className="bg-yellow-500/10 p-8 rounded-2xl border border-yellow-500/30">
          <Hammer
            size={64}
            className="text-yellow-500 mx-auto mb-4 animate-bounce"
          />
          <h1 className="text-3xl font-bold mb-2">Orchard Closed</h1>
          <p className="text-gray-400">
            The farmers are tending to the trees. Come back later for fresh
            fruit.
          </p>
        </div>
      </div>
    );
  }

  if (view === "menu") {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
        <FloatingBackground />

        <div className="z-10 text-center mb-10 animate-in fade-in zoom-in duration-700 relative">
          <div className="flex justify-center gap-2 mb-4 animate-bounce">
            <Banana size={48} className="text-yellow-400" />
            <Cherry size={48} className="text-red-500" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 font-serif tracking-tight drop-shadow-xl italic transform -rotate-2">
            FRUCTOSE FURY
          </h1>
          <p className="text-white/60 tracking-[0.5em] uppercase mt-4 text-sm font-bold">
            Juicy Risks & Sweet Rewards
          </p>
        </div>

        <div className="bg-gray-900/80 backdrop-blur border border-yellow-500/30 p-8 rounded-2xl w-full max-w-md shadow-2xl z-10 animate-in slide-in-from-bottom-10 duration-700 delay-100">
          {error && (
            <div className="bg-red-900/50 text-red-200 p-2 mb-4 rounded text-center text-sm border border-red-800">
              {error}
            </div>
          )}
          <input
            className="w-full bg-black/50 border border-gray-600 p-3 rounded-xl mb-4 text-white placeholder-gray-500 focus:border-yellow-500 outline-none transition-colors"
            placeholder="Farmer Name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
          <button
            onClick={createRoom}
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 p-4 rounded-xl font-bold mb-4 flex items-center justify-center gap-2 shadow-lg transform hover:scale-105 transition-all text-white"
          >
            <Play size={20} fill="currentColor" /> Open New Stand
          </button>

          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              className="w-full sm:flex-1 bg-black/50 border border-gray-600 p-3 rounded-xl text-white placeholder-gray-500 uppercase font-mono tracking-wider focus:border-yellow-500 outline-none"
              placeholder="ROOM CODE"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
            />
            <button
              onClick={joinRoom}
              disabled={loading}
              className="w-full sm:w-auto bg-gray-800 hover:bg-gray-700 border border-gray-600 px-6 py-3 rounded-xl font-bold transition-colors"
            >
              Join
            </button>
          </div>

          <button
            onClick={() => setShowGuide(true)}
            className="w-full text-center text-gray-400 hover:text-white text-sm flex items-center justify-center gap-2"
          >
            <BookOpen size={14} /> How to Play
          </button>
        </div>

        {showGuide && <GameGuideModal onClose={() => setShowGuide(false)} />}
      </div>
    );
  }

  if (view === "lobby" && gameState) {
    const isHost = gameState.hostId === user.uid;
    const allReady = gameState.players.every((p) => p.ready);

    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6 relative">
        <FloatingBackground />

        <div className="z-10 w-full max-w-lg bg-gray-900/90 backdrop-blur p-8 rounded-2xl border border-orange-500/30 shadow-2xl">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-800">
            <div>
              <h2 className="text-xl text-yellow-500 font-bold uppercase tracking-wider">
                Fruit Stand
              </h2>
              <div className="text-3xl font-mono text-white font-black tracking-widest">
                {gameState.roomId}
              </div>
            </div>
            <button
              onClick={() => setShowLeaveConfirm(true)}
              className="p-2 bg-red-900/30 hover:bg-red-900/50 rounded-full text-red-400 transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>

          <div className="space-y-3 mb-8">
            {gameState.players.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-gray-700"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full ${
                      p.ready
                        ? "bg-green-500 text-black"
                        : "bg-gray-700 text-gray-400"
                    }`}
                  >
                    <User size={18} />
                  </div>
                  <span
                    className={`font-bold ${
                      p.id === user.uid ? "text-yellow-400" : "text-gray-300"
                    }`}
                  >
                    {p.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {p.ready && (
                    <span className="text-green-500 text-xs font-bold uppercase tracking-wider">
                      Ready
                    </span>
                  )}
                  {isHost && p.id !== user.uid && (
                    <button
                      onClick={() => kickPlayer(p.id)}
                      className="text-gray-600 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {gameState.players.length < 2 && (
              <div className="text-center text-gray-500 py-4 italic">
                Waiting for more farmers...
              </div>
            )}
          </div>

          {isHost ? (
            <button
              onClick={startGame}
              disabled={gameState.players.length < 2}
              className={`w-full py-4 rounded-xl font-black text-xl uppercase tracking-widest shadow-lg transition-all ${
                gameState.players.length >= 2
                  ? "bg-green-600 hover:bg-green-500 text-white hover:scale-105"
                  : "bg-gray-800 text-gray-500 cursor-not-allowed"
              }`}
            >
              Start Harvest
            </button>
          ) : (
            <button
              onClick={toggleReady}
              className={`w-full py-4 rounded-xl font-black text-xl uppercase tracking-widest shadow-lg transition-all ${
                gameState.players.find((p) => p.id === user.uid)?.ready
                  ? "bg-gray-700 text-green-400 border-2 border-green-500"
                  : "bg-blue-600 hover:bg-blue-500 text-white hover:scale-105"
              }`}
            >
              {gameState.players.find((p) => p.id === user.uid)?.ready
                ? "Ready!"
                : "Mark Ready"}
            </button>
          )}
        </div>

        {showLeaveConfirm && (
          <LeaveConfirmModal
            onConfirm={leaveRoom}
            onCancel={() => setShowLeaveConfirm(false)}
            isHost={isHost}
          />
        )}
      </div>
    );
  }

  if (view === "game" && gameState) {
    const me = gameState.players.find((p) => p.id === user.uid);
    const isMyTurn = gameState.players[gameState.turnIndex].id === user.uid;
    const opponent = gameState.players.filter((p) => p.id !== user.uid);
    const activePlayer = gameState.players[gameState.turnIndex];

    const isStealing = gameState.turnPhase === "STEALING";
    const stealTargetName = isStealing
      ? gameState.players.find((p) => p.id === gameState.stealTargetId)?.name
      : "";

    // Calculate winner if finished
    let winner = null;
    if (gameState.status === "finished") {
      winner = [...gameState.players].sort(
        (a, b) => b.bank.length - a.bank.length
      )[0];
    }

    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col relative overflow-hidden">
        <FloatingBackground />

        {/* Header */}
        <div className="h-14 bg-gray-900/90 border-b border-gray-800 flex items-center justify-between px-4 z-50 sticky top-0 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Banana className="text-yellow-500" size={20} />
            <span className="font-black uppercase tracking-tight text-lg hidden md:block">
              Fructose Fury
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowGuide(true)}
              className="p-2 text-gray-400 hover:bg-gray-800 rounded-full"
            >
              <BookOpen size={20} />
            </button>
            <button
              onClick={() => setShowLogHistory(true)}
              className="p-2 text-gray-400 hover:bg-gray-800 rounded-full"
            >
              <History size={20} />
            </button>
            <button
              onClick={() => setShowLeaveConfirm(true)}
              className="p-2 text-red-400 hover:bg-red-900/20 rounded-full"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* Modals */}
        {isStealing && isMyTurn && (
          <StealModal
            targetName={stealTargetName}
            fruitType={gameState.drawnCard}
            onSteal={() => {
              // Optimistic UI update could go here
              const updated = handleSteal(true);
            }}
            onPass={() => handleSteal(false)}
          />
        )}

        {showGuide && <GameGuideModal onClose={() => setShowGuide(false)} />}

        {showLeaveConfirm && (
          <LeaveConfirmModal
            onConfirm={leaveRoom}
            onCancel={() => setShowLeaveConfirm(false)}
            isHost={gameState.hostId === user.uid}
            onReturnToLobby={resetToLobby}
          />
        )}

        {showLogHistory && (
          <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4">
            <div className="bg-gray-900 w-full max-w-md h-[70vh] rounded-2xl flex flex-col border border-gray-700">
              <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                <h3 className="font-bold">Log</h3>
                <button onClick={() => setShowLogHistory(false)}>
                  <X />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {[...gameState.logs].reverse().map((l, i) => (
                  <div
                    key={i}
                    className={`p-2 rounded text-sm border-l-2 ${
                      l.type === "danger"
                        ? "border-red-500 bg-red-900/20"
                        : l.type === "warning"
                        ? "border-orange-500 bg-orange-900/20"
                        : "border-gray-500 bg-gray-800"
                    }`}
                  >
                    {l.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState.status === "finished" && (
          <div className="fixed inset-0 z-[150] bg-black/95 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in">
            <Trophy size={80} className="text-yellow-400 mb-6 animate-bounce" />
            <h1 className="text-5xl font-black text-white mb-2 uppercase">
              Harvest Complete!
            </h1>
            <p className="text-2xl text-gray-300 mb-8">
              The Master Farmer is{" "}
              <span className="text-yellow-400 font-bold">{winner?.name}</span>{" "}
              with {winner?.bank.length} fruits!
            </p>
            <div className="grid grid-cols-2 gap-4 max-w-md w-full">
              {gameState.players.map((p) => (
                <div
                  key={p.id}
                  className="bg-gray-800 p-4 rounded-xl flex justify-between items-center border border-gray-700"
                >
                  <span
                    className={
                      p.id === winner.id
                        ? "text-yellow-400 font-bold"
                        : "text-gray-400"
                    }
                  >
                    {p.name}
                  </span>
                  <span className="font-mono text-xl">{p.bank.length}</span>
                </div>
              ))}
            </div>
            {gameState.hostId === user.uid && (
              <div className="mt-8 flex gap-4">
                <button
                  onClick={resetToLobby}
                  className="px-8 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold"
                >
                  Lobby
                </button>
                <button
                  onClick={startGame}
                  className="px-8 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-white shadow-lg"
                >
                  New Harvest
                </button>
              </div>
            )}
          </div>
        )}

        {/* Main Game Area */}
        <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full p-4 gap-4">
          {/* Top: Opponents */}
          <div className="flex-1 flex items-start justify-center gap-4 flex-wrap content-start min-h-[120px]">
            {opponent.map((p) => (
              <div
                key={p.id}
                className={`bg-gray-900/80 p-3 rounded-xl border-2 flex flex-col gap-2 min-w-[140px] transition-all ${
                  gameState.players[gameState.turnIndex].id === p.id
                    ? "border-yellow-500 scale-105 shadow-yellow-900/20 shadow-lg"
                    : "border-gray-800 opacity-80"
                }`}
              >
                <div className="flex justify-between items-center border-b border-gray-700 pb-1">
                  <span className="font-bold text-sm truncate max-w-[100px]">
                    {p.name}
                  </span>
                  <div className="flex items-center gap-1 bg-green-900/30 px-1.5 rounded text-green-400 text-xs">
                    <Trophy size={10} /> {p.bank.length}
                  </div>
                </div>

                {/* Opponent Danger Zone (Stealable) */}
                <div className="flex flex-wrap gap-1 min-h-[40px] bg-black/20 rounded p-1">
                  {p.table.length === 0 ? (
                    <span className="text-[10px] text-gray-600 w-full text-center py-2">
                      Safe
                    </span>
                  ) : (
                    p.table.map((fruit, i) => (
                      <div
                        key={i}
                        className="transform scale-75 origin-top-left -mr-4 hover:z-10 hover:scale-100 transition-transform"
                      >
                        <Card type={fruit} size="sm" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Center: Action Area */}
          <div className="flex-[2] flex flex-col items-center justify-center gap-8 relative">
            {/* Log Ticker */}
            <div className="absolute top-0 pointer-events-none w-full flex justify-center">
              {gameState.logs.length > 0 && (
                <div className="bg-black/60 backdrop-blur px-4 py-1 rounded-full text-xs text-yellow-100/80 border border-yellow-500/20 animate-in fade-in slide-in-from-top-2">
                  {gameState.logs[gameState.logs.length - 1].text}
                </div>
              )}
            </div>

            <div className="flex items-center gap-8 md:gap-16">
              {/* Deck */}
              <button
                onClick={isMyTurn && !isStealing ? handleDraw : undefined}
                disabled={!isMyTurn || isStealing}
                className={`relative w-24 h-36 md:w-32 md:h-48 bg-gray-800 rounded-xl border-4 border-gray-700 shadow-2xl flex items-center justify-center group transition-all ${
                  isMyTurn && !isStealing
                    ? "hover:scale-105 cursor-pointer hover:border-yellow-500 ring-4 ring-yellow-500/20"
                    : "opacity-80 cursor-default"
                }`}
              >
                <div className="absolute inset-2 border-2 border-dashed border-gray-600 rounded-lg" />
                <div className="text-center z-10">
                  <span className="block font-black text-2xl text-gray-500">
                    {gameState.deck.length}
                  </span>
                  <span className="text-[10px] uppercase text-gray-600 font-bold">
                    Cards Left
                  </span>
                </div>
                {isMyTurn && !isStealing && (
                  <div className="absolute -bottom-8 bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full animate-bounce shadow-lg">
                    DRAW!
                  </div>
                )}
              </button>

              {/* Current Hand (Risk Zone) */}
              <div className="flex items-center justify-center p-4 bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-700 min-h-[160px] min-w-[200px] md:min-w-[400px]">
                {activePlayer.hand.length === 0 ? (
                  <span className="text-gray-600 font-bold uppercase tracking-widest text-sm">
                    Risk Zone Empty
                  </span>
                ) : (
                  <div className="flex -space-x-8 md:-space-x-12">
                    {activePlayer.hand.map((fruit, i) => (
                      <div
                        key={i}
                        className="transform transition-transform hover:-translate-y-4 hover:scale-110 z-0 hover:z-10"
                      >
                        <Card
                          type={fruit}
                          animate={i === activePlayer.hand.length - 1}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            {isMyTurn && activePlayer.hand.length > 0 && !isStealing && (
              <div className="flex gap-4 animate-in slide-in-from-bottom-4">
                <button
                  onClick={handleStop}
                  className="bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-xl font-black text-xl shadow-lg shadow-green-900/20 transform hover:scale-105 transition-all flex items-center gap-2"
                >
                  <CheckCircle /> BANK IT!
                </button>
              </div>
            )}

            {/* Status Text */}
            {!isMyTurn && (
              <div className="bg-gray-900/80 px-6 py-3 rounded-full border border-gray-700 text-gray-400 font-mono text-sm animate-pulse">
                Waiting for {activePlayer.name}...
              </div>
            )}
          </div>

          {/* Bottom: My Player Area */}
          <div
            className={`bg-gray-900 p-4 rounded-t-3xl border-t-4 ${
              isMyTurn ? "border-yellow-500" : "border-gray-800"
            } shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20`}
          >
            <div className="flex justify-between items-end">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gray-800 rounded-full border-2 border-gray-600 flex items-center justify-center overflow-hidden">
                    <User size={32} className="text-gray-400" />
                  </div>
                  <div className="absolute -top-2 -right-2 bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg border-2 border-gray-900">
                    {me.bank.length}
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {me.name} (You)
                  </h3>
                  <div className="text-xs text-green-400 font-bold uppercase tracking-wider">
                    Safe Zone
                  </div>
                </div>
              </div>

              {/* My Danger Zone (Pending Bank) */}
              <div className="flex-1 ml-8 flex flex-col items-end">
                <span className="text-xs text-orange-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                  <AlertTriangle size={12} /> Danger Zone (Next Turn Bank)
                </span>
                <div className="flex flex-wrap justify-end gap-2 bg-black/30 p-2 rounded-xl border border-gray-800 w-full md:w-auto min-h-[60px] min-w-[150px]">
                  {me.table.length === 0 ? (
                    <span className="text-gray-600 text-xs self-center mx-auto">
                      Empty
                    </span>
                  ) : (
                    me.table.map((fruit, i) => (
                      <div
                        key={i}
                        className="transform scale-75 hover:scale-100 transition-transform origin-bottom"
                      >
                        <Card type={fruit} size="sm" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
