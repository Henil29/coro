import React, { useCallback, useEffect, useRef, useState, useContext } from "react";
import { useLocation } from "react-router-dom";
import axios from "../config/axios";
import { useNavigate } from 'react-router-dom';
import { initializeSocket, reciveMessage, sendMessage } from "../config/socket";
import { UserContext } from "../context/user.context";

const Project = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const project = location.state?.project;
    const [panelWidth, setPanelWidth] = useState(() =>
        parseInt(localStorage.getItem("panelWidth")) || 450
    );
    const isResizing = useRef(false);

    const [showMembers, setShowMembers] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [users, setUsers] = useState([]);
    const [usersInProject, setUsersinProject] = useState([]);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const { user } = useContext(UserContext);
    const messageBox = useRef(null);
    const seenMessageIdsRef = useRef(new Set());

    const toggleUserSelection = (id) => {
        setSelectedUsers((prev) =>
            prev.includes(id) ? prev.filter((userId) => userId !== id) : [...prev, id]
        );
    };

    const handleAddUsers = () => {
        const added = users.filter((user) => selectedUsers.includes(user._id));
        axios.put('/project/add-user', { users: added.map(u => u._id), projectId: project._id })
            .then((response) => {
                console.log('Users added successfully:', response.data);
            })
            .catch((error) => {
                console.error('Error adding users:', error);
            });
        setUsersinProject((prev) => [...prev, ...added]);

        setIsAddModalOpen(false);
        setSelectedUsers([]);
    };

    const filteredUsers = users.filter((user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const appendIncomingMessage = useCallback((incomingMessage) => {
        if (!incomingMessage) return;

        const rawId = incomingMessage._id || incomingMessage.id;
        const trimmedText = (incomingMessage.message || "").trim();
        const tempId = incomingMessage.tempId;

        const senderData = typeof incomingMessage.sender === "object" && incomingMessage.sender !== null
            ? incomingMessage.sender
            : { _id: incomingMessage.sender };

        const preparedMessage = {
            id: rawId || tempId || `remote-${Date.now()}`,
            tempId: tempId,
            text: trimmedText,
            senderId: senderData?._id,
            senderName: senderData?.name || incomingMessage.senderName || "",
            createdAt: incomingMessage.createdAt || new Date().toISOString(),
            status: "delivered",
        };

        setMessages((prev) => {
            if (rawId && seenMessageIdsRef.current.has(rawId)) {
                return prev;
            }

            const updatedMessages = [...prev];

            if (tempId) {
                const pendingIndex = updatedMessages.findIndex((msg) => msg.tempId === tempId);
                if (pendingIndex !== -1) {
                    updatedMessages[pendingIndex] = {
                        ...updatedMessages[pendingIndex],
                        ...preparedMessage,
                    };
                    if (rawId) {
                        seenMessageIdsRef.current.add(rawId);
                    }
                    return updatedMessages;
                }
            }

            if (senderData?._id && senderData._id === user?._id) {
                const fallbackIndex = updatedMessages.findIndex(
                    (msg) => msg.status === "pending" && msg.senderId === senderData._id && msg.text === trimmedText
                );
                if (fallbackIndex !== -1) {
                    updatedMessages[fallbackIndex] = {
                        ...updatedMessages[fallbackIndex],
                        ...preparedMessage,
                    };
                    if (rawId) {
                        seenMessageIdsRef.current.add(rawId);
                    }
                    return updatedMessages;
                }
            }

            if (rawId) {
                seenMessageIdsRef.current.add(rawId);
            }

            return [...updatedMessages, preparedMessage];
        });

        if (typeof window !== "undefined" && window.requestAnimationFrame) {
            window.requestAnimationFrame(() => {
                if (messageBox.current) {
                    messageBox.current.scrollTop = messageBox.current.scrollHeight;
                }
            });
        } else if (messageBox.current) {
            messageBox.current.scrollTop = messageBox.current.scrollHeight;
        }
    }, [user?._id]);

    const sendMsg = () => {
        if (!user?._id || !message.trim()) return;

        const trimmed = message.trim();
        const tempId = `local-${Date.now()}`;

        const localMessage = {
            id: tempId,
            tempId,
            text: trimmed,
            senderId: user._id,
            senderName: user.name,
            createdAt: new Date().toISOString(),
            status: "pending",
        };

        setMessages((prev) => [...prev, localMessage]);

        if (typeof window !== "undefined" && window.requestAnimationFrame) {
            window.requestAnimationFrame(() => {
                if (messageBox.current) {
                    messageBox.current.scrollTop = messageBox.current.scrollHeight;
                }
            });
        } else if (messageBox.current) {
            messageBox.current.scrollTop = messageBox.current.scrollHeight;
        }

        sendMessage('project-message', {
            message: trimmed,
            sender: user._id,
            tempId,
        });
        setMessage('');
    }
    // --- Handle resizing ---
    const handleMouseDown = () => {
        isResizing.current = true;
        document.body.style.cursor = "col-resize";
    };

    const handleMouseMove = (e) => {
        if (!isResizing.current) return;
        const newWidth = Math.min(Math.max(e.clientX, 240), 600);
        setPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
        isResizing.current = false;
        document.body.style.cursor = "default";
    };

    useEffect(() => {
        if (!project?._id) return;

        initializeSocket(project._id);

        const messageHandler = (data) => {
            console.log('New message received:', data);
            appendIncomingMessage(data);
        };

        reciveMessage('project-message', messageHandler);

        axios.get('/user/all')
            .then((response) => {
                setUsers(response.data.users);
            })
            .catch((error) => console.error('Error fetching users!', error));

        axios.get(`/project/get-project/${project._id}`)
            .then((response) => {
                setUsersinProject(response.data.project.users);
            })
            .catch((error) => console.error('Error fetching users in Project!', error));

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [appendIncomingMessage, project?._id]);

    useEffect(() => {
        localStorage.setItem("panelWidth", panelWidth);
    }, [panelWidth]);
    return (
        <main className="h-screen w-screen bg-(--color-primary) text-(--color-light) flex overflow-hidden">
            {/* LEFT PANEL */}
            <section
                className="flex flex-col h-full border-r border-(--color-border) bg-(--color-secondary) select-none relative"
                style={{ width: `${panelWidth}px` }}
            >
                {/* HEADER */}
                <header className="flex items-center justify-between px-4 py-3 border-b border-(--color-border) bg-(--color-tertiary)">
                    <button className="text-(--color-light) hover:text-(--color-accent) transition-all cursor-pointer" onClick={() => navigate('/')}>
                        <i className="ri-arrow-left-line text-lg"></i>
                    </button>
                    <h2 className="text-sm font-medium opacity-80 truncate select-none">
                        {project?.name || "Untitled Project"}
                    </h2>
                    <button
                        onClick={() => setShowMembers(!showMembers)}
                        className={`text-(--color-light) hover:text-(--color-accent) transition-all cursor-pointer ${showMembers ? "text-(--color-accent)" : ""
                            }`}
                    >
                        <i className="ri-group-line text-lg"></i>
                    </button>
                </header>

                {/* CHAT AREA + INPUT FIELD (Static) */}
                <div className="absolute top-13 inset-x-0 bottom-0 flex flex-col">
                    {/* CHAT MESSAGES */}
                    <div
                        ref={messageBox}
                        className="flex flex-col grow overflow-y-auto scrollbar-hide p-4 space-y-4 message-box"
                    >
                        {messages.length === 0 ? (
                            <p className="text-(--color-muted) text-sm text-center mt-6">
                                No messages yet. Start the conversation!
                            </p>
                        ) : (
                            messages.map((msg) => {
                                const isUserMessage = msg.senderId && user?._id === msg.senderId;
                                const lookupUser = usersInProject.find((member) => member._id === msg.senderId)
                                    || users.find((member) => member._id === msg.senderId);
                                const displayName = isUserMessage
                                    ? "You"
                                    : lookupUser?.name || msg.senderName || "Team Member";
                                const avatarSeed = lookupUser?.name || msg.senderName || displayName;
                                const timestamp = msg.createdAt
                                    ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                                    : "";

                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex items-start gap-3 ${isUserMessage ? "flex-row-reverse ml-10" : ""}`}
                                    >
                                        <img
                                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(avatarSeed || "Member")}&background=${isUserMessage ? "C2B36E" : "444"}&color=${isUserMessage ? "000" : "fff"}`}
                                            alt={displayName}
                                            className="w-9 h-9 rounded-full border border-(--color-border) object-cover"
                                        />
                                        <div className="flex flex-col max-w-[80%]">
                                            <div
                                                className={`text-xs font-medium mb-1 ${isUserMessage
                                                    ? "text-(--color-accent)"
                                                    : "text-(--color-muted)"
                                                    }`}
                                            >
                                                {displayName}
                                            </div>
                                            <div
                                                className={`rounded-xl px-4 py-2 text-sm leading-relaxed ${isUserMessage
                                                    ? "bg-(--color-accent) text-(--color-primary)"
                                                    : "bg-(--color-tertiary) text-(--color-light)"
                                                    }`}
                                            >
                                                {msg.text}
                                            </div>
                                            {(timestamp || msg.status === "pending") && (
                                                <span className="text-[11px] opacity-60 mt-1">
                                                    {timestamp}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* INPUT FIELD */}
                    <div className="border-t border-(--color-border) bg-(--color-tertiary) px-3 py-2">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (message.trim()) sendMsg();
                            }}
                            className="flex items-center"
                        >
                            <input
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                type="text"
                                placeholder="Type a message..."
                                className="grow bg-transparent outline-none text-(--color-light) placeholder-(--color-muted) px-2 py-1"
                            />

                            <button
                                type="submit"
                                className="p-2 text-(--color-accent) hover:text-(--color-accent-hover) transition-all cursor-pointer"
                            >
                                <i className="ri-send-plane-2-fill text-lg"></i>
                            </button>
                        </form>
                    </div>

                </div>

                {/* MEMBERS PANEL (Slides in from left) */}
                <div
                    className={`absolute top-13 inset-y-0 left-0 w-full bg-(--color-secondary) border-r border-t border-(--color-border)
  shadow-xl transform transition-transform duration-500 ease-in-out ${showMembers ? "translate-x-0" : "-translate-x-full"
                        }`}
                >
                    <div className="p-4 flex flex-col h-full">
                        {/* Header inside sidebar */}
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-semibold border-b border-(--color-border) pb-2">
                                Team Members
                            </h3>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="px-3 py-1.5 rounded-md bg-(--color-accent) text-(--color-primary) hover:opacity-90 transition-all text-sm font-medium"
                                >
                                    + Add User
                                </button>
                                <button
                                    onClick={() => setShowMembers(false)}
                                    className="text-(--color-light) hover:text-(--color-accent) transition-all"
                                >
                                    <i className="ri-close-line text-lg"></i>
                                </button>
                            </div>
                        </div>

                        {/* Members list */}
                        <div className="flex flex-col gap-3 overflow-y-auto">
                            {usersInProject.map((user) => (
                                <div
                                    key={user._id}
                                    className="flex items-center gap-3 bg-(--color-tertiary) border border-(--color-border) rounded-xl px-4 py-2
          hover:border-(--color-accent) transition-all cursor-pointer"
                                >
                                    <img
                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=444&color=fff`}
                                        alt={user.name}
                                        className="w-9 h-9 rounded-full border border-(--color-border) object-cover"
                                    />
                                    <span className="text-sm font-medium text-(--color-light)">
                                        {user.name}
                                        {user._id === project.users[0] &&
                                            <span className="ml-2 text-xs bg-(--color-accent) text-(--color-primary) px-2 py-0.5 rounded-full">
                                                Admin
                                            </span>
                                        }
                                        {
                                            user._id === JSON.parse(localStorage.getItem("user"))._id &&
                                            <span className="ml-2 text-xs bg-(--color-accent) text-(--color-primary) px-2 py-0.5 rounded-full">
                                                You
                                            </span>
                                        }
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Add User Modal */}
                    {isAddModalOpen && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                            <div className="bg-(--color-secondary) border border-(--color-border) rounded-2xl w-full max-w-md p-6">

                                {/* Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-semibold text-(--color-light)">
                                        Add Users to Project
                                    </h2>
                                    <button
                                        onClick={() => {
                                            setIsAddModalOpen(false);
                                            setSelectedUsers([]);
                                            setSearchQuery("");
                                        }}
                                        className="text-(--color-light) hover:text-(--color-accent) transition-all text-lg"
                                    >
                                        <i className="ri-close-line"></i>
                                    </button>
                                </div>

                                {/* Search Bar */}
                                <div className="mb-4 relative">
                                    <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-(--color-muted)"></i>
                                    <input
                                        type="text"
                                        placeholder="Search users..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-(--color-tertiary) border border-(--color-border) rounded-md px-9 py-2 text-(--color-light) placeholder-(--color-muted)
            focus:outline-none focus:ring-1 focus:ring-(--color-accent) transition-all"
                                    />
                                </div>

                                {/* User list */}
                                <div className="flex flex-col gap-3 max-h-60 overflow-y-auto">
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map((user) => {
                                            const isSelected = selectedUsers.includes(user._id);
                                            return (
                                                <div
                                                    key={user._id}
                                                    onClick={() => toggleUserSelection(user._id)}
                                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                                                        ${isSelected
                                                            ? "bg-(--color-accent) text-(--color-primary) border-(--color-accent)"
                                                            : "bg-(--color-tertiary) border border-(--color-border) hover:border-(--color-accent)"
                                                        }`}
                                                >
                                                    <img
                                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=444&color=fff`}
                                                        alt={user.name}
                                                        className="w-8 h-8 rounded-full border border-(--color-border) object-cover"
                                                    />
                                                    <span
                                                        className={`text-sm font-medium ${isSelected
                                                            ? "text-(--color-primary)"
                                                            : "text-(--color-light)"
                                                            }`}
                                                    >
                                                        {user.email}
                                                    </span>
                                                    {isSelected && (
                                                        <i className="ri-check-line ml-auto text-(--color-primary) font-bold text-lg"></i>
                                                    )}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-center text-(--color-muted) text-sm py-4">
                                            No users found
                                        </p>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        onClick={() => {
                                            setIsAddModalOpen(false);
                                            setSelectedUsers([]);
                                            setSearchQuery("");
                                        }}
                                        className="px-4 py-2 rounded-md border border-(--color-accent) text-(--color-light) hover:bg-(--color-primary) transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddUsers}
                                        className="px-4 py-2 rounded-md bg-(--color-accent) text-(--color-primary) hover:opacity-90 transition-all font-medium"
                                    >
                                        Add Selected
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* RESIZER HANDLE */}
            <div
                onMouseDown={handleMouseDown}
                className="w-[3px] cursor-col-resize bg-transparent hover:bg-(--color-accent)/40 transition-all"
            />

            {/* RIGHT SIDE */}
            <section className="grow bg-(--color-primary)"></section>
        </main>
    );
};

export default Project;
