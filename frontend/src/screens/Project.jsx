import React, { useCallback, useEffect, useRef, useState, useContext } from "react";
import { useLocation } from "react-router-dom";
import axios from "../config/axios";
import { useNavigate } from 'react-router-dom';
import { initializeSocket, reciveMessage as receiveMessage, sendMessage } from "../config/socket";
import { UserContext } from "../context/user.context";
import Markdown from 'markdown-to-jsx'
import Editor from "@monaco-editor/react";
import { getWebContainer } from "../config/webContainers";

const getInitials = (value) => {
    if (!value) {
        return "?";
    }
    const parts = value.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) {
        return "?";
    }
    const initials = parts
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("");
    return initials || "?";
};

const AvatarBadge = ({ label, background = "#444444", color = "#ffffff", className = "" }) => {
    const initials = getInitials(label);
    return (
        <div
            className={`w-9 h-9 rounded-full border border-(--color-border) flex items-center justify-center text-xs font-semibold uppercase ${className}`.trim()}
            style={{ backgroundColor: background, color }}
        >
            {initials}
        </div>
    );
};

const Project = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const project = location.state?.project;
    const [panelWidth, setPanelWidth] = useState(() =>
        parseInt(localStorage.getItem("panelWidth")) || 450
    );
    const isResizing = useRef(false);
    const previousUserSelect = useRef("");

    const [showMembers, setShowMembers] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [users, setUsers] = useState([]);
    const [usersInProject, setUsersinProject] = useState([]);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [fileTree, setFileTree] = useState({});
    const [currentFile, setCurrentFile] = useState(null);
    const [openFiles, setOpenFiles] = useState([]);
    const { user } = useContext(UserContext);
    const [webContainer, setWebContainer] = useState(null);
    const [runProcess, setRunProcess] = useState(null)
    const [iframeUrl, setIframeUrl] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const messageBox = useRef(null);
    const currentFileContent = currentFile ? fileTree[currentFile]?.content ?? "" : "";

    const resolveLanguage = useCallback((fileName) => {
        if (!fileName) return "plaintext";
        const extension = fileName.split(".").pop()?.toLowerCase();
        switch (extension) {
            case "js":
            case "jsx":
            case "ts":
            case "tsx":
                return "javascript";
            case "json":
                return "json";
            case "html":
            case "htm":
                return "html";
            case "css":
                return "css";
            case "md":
            case "markdown":
                return "markdown";
            case "py":
                return "python";
            case "java":
                return "java";
            case "c":
            case "h":
                return "c";
            case "cpp":
            case "hpp":
                return "cpp";
            case "sh":
            case "bash":
                return "bash";
            case "sql":
                return "sql";
            default:
                return "plaintext";
        }
    }, []);

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

    const normalizeFileTree = useCallback((tree) => {
        if (!tree || typeof tree !== "object") {
            return null;
        }

        const normalized = {};

        Object.entries(tree).forEach(([path, value]) => {
            if (!path) {
                return;
            }

            let content;

            if (typeof value === "string") {
                content = value;
            } else if (value && typeof value === "object") {
                if (typeof value.content === "string") {
                    content = value.content;
                } else if (typeof value.contents === "string") {
                    content = value.contents;
                } else if (value.file && typeof value.file.contents === "string") {
                    content = value.file.contents;
                } else if (typeof value.code === "string") {
                    content = value.code;
                }
            }

            if (content !== undefined) {
                normalized[path] = { content };
            }
        });

        return Object.keys(normalized).length ? normalized : null;
    }, []);

    const handleIncomingMessage = useCallback((incomingMessage) => {
        if (!incomingMessage) return;

        const senderData = typeof incomingMessage.sender === "object" && incomingMessage.sender !== null
            ? incomingMessage.sender
            : { _id: incomingMessage.sender };

        const isAIMessage = senderData?._id === "ai";

        let textPayload = incomingMessage.message;
        let aiFileTree = null;

        if (isAIMessage && typeof incomingMessage.message === "string") {
            try {
                const parsed = JSON.parse(incomingMessage.message);
                if (parsed && typeof parsed === "object") {
                    if (typeof parsed.text === "string") {
                        textPayload = parsed.text;
                    }
                    if (parsed.fileTree && typeof parsed.fileTree === "object") {
                        aiFileTree = parsed.fileTree;
                    }
                }
            } catch {
                /* keep raw message text */
            }
        }

        if (isAIMessage && !aiFileTree && incomingMessage.fileTree && typeof incomingMessage.fileTree === "object") {
            aiFileTree = incomingMessage.fileTree;
        }

        const preparedMessage = {
            id: incomingMessage._id || incomingMessage.id || `remote-${Date.now()}`,
            text: typeof textPayload === "string" ? textPayload : "",
            senderId: senderData?._id,
            senderName: senderData?.name || incomingMessage.senderName || "",
            createdAt: incomingMessage.createdAt || new Date().toISOString(),
            renderAsMarkdown: isAIMessage,
        };

        setMessages((prev) => [...prev, preparedMessage]);

        if (isAIMessage && aiFileTree) {
            const normalizedTree = normalizeFileTree(aiFileTree);
            if (normalizedTree) {
                setFileTree(normalizedTree);
                setCurrentFile((prev) => {
                    if (prev && normalizedTree[prev]) {
                        return prev;
                    }
                    const [firstFile] = Object.keys(normalizedTree);
                    return firstFile || prev;
                });
            }
        }

        if (typeof window !== "undefined" && window.requestAnimationFrame) {
            window.requestAnimationFrame(() => {
                if (messageBox.current) {
                    messageBox.current.scrollTop = messageBox.current.scrollHeight;
                }
            });
        } else if (messageBox.current) {
            messageBox.current.scrollTop = messageBox.current.scrollHeight;
        }
    }, [messageBox, normalizeFileTree]);

    const sendMsg = () => {
        if (!user || !message.trim()) return;

        const trimmed = message.trim();
        const localMessage = {
            id: `local-${Date.now()}`,
            text: trimmed,
            senderId: user._id,
            senderName: user.name,
            createdAt: new Date().toISOString(),
            renderAsMarkdown: false,
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
            sender: user,
        });

        setMessage('');
    }
    // --- Handle resizing ---
    const handleMouseDown = (event) => {
        event.preventDefault();
        isResizing.current = true;
        previousUserSelect.current = document.body.style.userSelect;
        document.body.style.userSelect = "none";
        document.body.style.cursor = "col-resize";
    };

    const handleMouseMove = (e) => {
        if (!isResizing.current) return;
        e.preventDefault();
        const newWidth = Math.min(Math.max(e.clientX, 240), 600);
        setPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
        isResizing.current = false;
        document.body.style.cursor = "default";
        document.body.style.userSelect = previousUserSelect.current || "";
    };

    useEffect(() => {
        if (!project?._id) return;
        initializeSocket(project._id);

        if (!webContainer) {
            getWebContainer().then((wc) => {
                setWebContainer(wc);
                console.log("container set", wc);
            });
        }

        const messageHandler = (data) => {
            handleIncomingMessage(data);
            console.log(data);
            webContainer?.mount(data.fileTree);
        };

        receiveMessage('project-message', messageHandler);

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
            handleMouseUp();
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, []);

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
                                        <AvatarBadge
                                            label={avatarSeed || "Member"}
                                            background={isUserMessage ? "#C2B36E" : "#444444"}
                                            color={isUserMessage ? "#000000" : "#ffffff"}
                                            className="shrink-0"
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
                                                className={`rounded-xl px-4 py-2 text-sm leading-relaxed whitespace-pre-wrap wrap-break-word select-text ${isUserMessage
                                                    ? "bg-(--color-accent) text-(--color-primary)"
                                                    : msg.renderAsMarkdown
                                                        ? "bg-[rgba(11,21,40,0.85)] border border-(--color-border) text-(--color-light)"
                                                        : "bg-(--color-tertiary) text-(--color-light)"
                                                    }`}
                                            >
                                                {msg.renderAsMarkdown ? (
                                                    <div className="overflow-auto ai-message">
                                                        <Markdown options={{ forceBlock: true }}>{msg.text}</Markdown>
                                                    </div>
                                                ) : (
                                                    msg.text
                                                )}
                                            </div>
                                            {timestamp && (
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
                                    <AvatarBadge
                                        label={user.name}
                                        background="#444444"
                                        color="#ffffff"
                                        className="shrink-0"
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
                                                    <AvatarBadge
                                                        label={user.name}
                                                        background="#444444"
                                                        color="#ffffff"
                                                        className="w-8 h-8 text-xs"
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
                                        onClick={async () => {
                                            try {
                                                setIsRunning(true);
                                                console.log("🚀 Starting WebContainer...");

                                                // ✅ 1. Ensure webContainer exists
                                                if (!webContainer) {
                                                    console.error("WebContainer not initialized yet!");
                                                    return;
                                                }

                                                // ✅ 2. Create a clean file tree to mount
                                                const filesToMount = { ...fileTree };

                                                // Add missing package.json if not provided
                                                if (!filesToMount["package.json"]) {
                                                    filesToMount["package.json"] = {
                                                        file: {
                                                            contents: JSON.stringify(
                                                                {
                                                                    name: "es6-express-server",
                                                                    version: "1.0.0",
                                                                    type: "module",
                                                                    main: "server.js",
                                                                    scripts: {
                                                                        start: "node server.js",
                                                                    },
                                                                    dependencies: {
                                                                        express: "^4.19.2",
                                                                    },
                                                                },
                                                                null,
                                                                2
                                                            ),
                                                        },
                                                    };
                                                }

                                                // ✅ 3. Mount all project files into WebContainer
                                                await webContainer.mount(filesToMount);
                                                console.log("📦 Project files mounted:", Object.keys(filesToMount));

                                                // ✅ 4. Install dependencies
                                                console.log("📦 Installing dependencies...");
                                                const installProcess = await webContainer.spawn("npm", ["install"]);

                                                installProcess.output.pipeTo(
                                                    new WritableStream({
                                                        write(chunk) {
                                                            console.log(chunk);
                                                        },
                                                    })
                                                );

                                                const exitCode = await installProcess.exit;
                                                if (exitCode !== 0) {
                                                    console.error("❌ npm install failed");
                                                    setIsRunning(false);
                                                    return;
                                                }
                                                console.log("✅ Dependencies installed successfully!");

                                                // ✅ 5. Kill previous run process if running
                                                if (runProcess) {
                                                    runProcess.kill();
                                                }

                                                // ✅ 6. Run the app
                                                console.log("⚙️ Starting app...");
                                                const startProcess = await webContainer.spawn("npm", ["start"]);

                                                startProcess.output.pipeTo(
                                                    new WritableStream({
                                                        write(chunk) {
                                                            console.log(chunk);
                                                        },
                                                    })
                                                );

                                                setRunProcess(startProcess);

                                                // ✅ 7. Listen for when the server is ready
                                                webContainer.on("server-ready", (port, url) => {
                                                    console.log(`🌍 Server ready at: ${url}`);
                                                    setIframeUrl(url);
                                                });
                                            } catch (err) {
                                                console.error("❌ Error running project:", err);
                                            } finally {
                                                setIsRunning(false);
                                            }
                                        }}
                                        className="px-4 py-2 bg-(--color-accent) text-(--color-primary) rounded-md hover:opacity-90 transition-all font-semibold"
                                    >
                                        {isRunning ? "Running..." : "Run"}
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
            <section className="grow bg-(--color-primary) flex">
                <div className="explorer h-full min-w-64 bg-(--color-secondary) border-r border-(--color-border) w-64">
                    <div className="file-tree p-2">
                        {
                            Object.keys(fileTree).map((fileName) => (
                                <div
                                    key={fileName}
                                    onClick={() => {
                                        setCurrentFile(fileName)
                                        setOpenFiles([...new Set([...openFiles, fileName])]);
                                    }}
                                    className="p-2 border-b border-(--color-border) hover:bg-(--color-tertiary) cursor-pointer">
                                    {fileName}
                                </div>
                            ))
                        }
                    </div>
                </div>
                <div className="code-editor w-full h-full">
                    {currentFile ? (
                        <div className="h-full w-full flex flex-col grow">
                            <div className="top flex justify-between w-full">
                                <div className="files flex">
                                    {
                                        openFiles.map((fileName) => (
                                            <button
                                                key={fileName}
                                                onClick={() => setCurrentFile(fileName)}
                                                className={`px-4 py-2 border-b-2 ${currentFile === fileName ? "border-(--color-accent) bg-(--color-tertiary)" : "border-transparent hover:bg-(--color-tertiary)"} `}
                                            >
                                                {fileName}
                                            </button>
                                        ))
                                    }
                                </div>
                                <div className="actions flex gap-2">
                                    <button
                                        onClick={async () => {
                                            const installProcess = await webContainer.spawn("npm", ["install"])

                                            installProcess.output.pipeTo(new WritableStream({
                                                write(chunk) {
                                                    console.log(chunk)
                                                }
                                            }))

                                            if (runProcess) {
                                                runProcess.kill()
                                            }

                                            let tempRunProcess = await webContainer.spawn("npm", ["start"]);

                                            tempRunProcess.output.pipeTo(new WritableStream({
                                                write(chunk) {
                                                    console.log(chunk)
                                                }
                                            }))

                                            setRunProcess(tempRunProcess)

                                            webContainer.on('server-ready', (port, url) => {
                                                console.log(port, url)
                                                setIframeUrl(url)
                                            })

                                        }}
                                    >Run</button>
                                </div>
                            </div>
                            <div className="bottom h-full w-full overflow-auto">
                                {fileTree[currentFile] && (
                                    <div className="p-4">
                                        <Editor
                                            height="calc(100vh - 120px)" // adjusts height dynamically
                                            language={resolveLanguage(currentFile)}
                                            value={currentFileContent}
                                            theme="vs-dark"
                                            onChange={(value) => {
                                                // Update code content live inside fileTree state
                                                setFileTree((prev) => ({
                                                    ...prev,
                                                    [currentFile]: { ...prev[currentFile], content: value },
                                                }));
                                            }}
                                            options={{
                                                fontSize: 15,
                                                minimap: { enabled: false },
                                                scrollBeyondLastLine: false,
                                                wordWrap: "on",
                                                automaticLayout: true,
                                            }}
                                        />

                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full w-full text-(--color-muted)">
                            Select a file to view its contents
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
};

export default Project;
