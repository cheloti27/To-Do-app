// ================================
// SELECT ELEMENTS
// ================================

const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const taskCount = document.getElementById("taskCount");
const emptyMsg = document.getElementById("emptyMsg");
const searchInput = document.getElementById("searchInput");
const dueDateInput = document.getElementById("dueDate");
const priorityInput = document.getElementById("priority");
const filterBtns = document.querySelectorAll(".filter-btn");

let tasks = [];
let currentFilter = "all";

// ================================
// NOTIFICATIONS
// ================================

if ("Notification" in window) {
    Notification.requestPermission();
}

function showNotification(title, message) {

    if (Notification.permission === "granted") {

        new Notification(title, {
            body: message
        });

    }
}

// ================================
// LOCAL STORAGE
// ================================

function saveTasks() {

    localStorage.setItem(
        "tasks",
        JSON.stringify(tasks)
    );

}

function loadTasks() {

    const savedTasks =
        localStorage.getItem("tasks");

    if (savedTasks) {

        tasks = JSON.parse(savedTasks);

    }

}

// ================================
// CREATE TASK OBJECT
// ================================

function createTaskObject(
    text,
    dueDate,
    priority
) {

    return {

        id: Date.now().toString(),

        text,

        completed: false,

        dueDate,

        priority,

        createdAt:
        new Date().toLocaleString()

    };

}

// ================================
// ADD TASK
// ================================

taskForm.addEventListener(
    "submit",
    function(e) {

        e.preventDefault();

        const text =
            taskInput.value.trim();

        if (!text) {

            alert("Please enter a task.");
            return;

        }

        const duplicate =
            tasks.some(task =>
                task.text.toLowerCase() ===
                text.toLowerCase()
            );

        if (duplicate) {

            alert("Task already exists.");
            return;

        }

        const task =
            createTaskObject(
                text,
                dueDateInput.value,
                priorityInput.value
            );

        tasks.unshift(task);

        saveTasks();

        render();

        showNotification(
            "Task Added",
            text
        );

        taskForm.reset();

    }
);

// ================================
// RENDER TASKS
// ================================

function render() {

    taskList.innerHTML = "";

    let filteredTasks = tasks;

    if (currentFilter === "active") {

        filteredTasks =
            tasks.filter(
                task => !task.completed
            );

    }

    if (currentFilter === "completed") {

        filteredTasks =
            tasks.filter(
                task => task.completed
            );

    }

    filteredTasks.forEach(task => {

        const li =
            document.createElement("li");

        li.draggable = true;

        li.dataset.id = task.id;

        const today =
            new Date().toISOString().split("T")[0];

        const overdue =
            task.dueDate &&
            task.dueDate < today;

        li.innerHTML = `

        <div class="task-content">

            <input
            type="checkbox"
            ${task.completed ? "checked" : ""}>

            <span class="
            task-text
            ${task.completed ? "completed" : ""}
            ">
            ${task.text}
            </span>

            <span class="
            priority
            ${task.priority.toLowerCase()}
            ">
            ${task.priority}
            </span>

            <span class="due-date">
            ${task.dueDate || ""}
            </span>

            ${
                overdue
                ? '<span class="overdue">⚠ Overdue</span>'
                : ''
            }

        </div>

        <div class="actions">

            <button class="edit-btn">
            ✏️
            </button>

            <button class="delete-btn">
            🗑️
            </button>

        </div>
        `;

        attachEvents(
            li,
            task.id
        );

        taskList.appendChild(li);

    });

    updateCount();

}

// ================================
// TASK ACTIONS
// ================================

function toggleTask(id) {

    const task =
        tasks.find(
            task => task.id === id
        );

    if (task) {

        task.completed =
            !task.completed;

        saveTasks();

        render();

    }

}

function deleteTask(id) {

    const task =
        tasks.find(
            task => task.id === id
        );

    tasks =
        tasks.filter(
            task => task.id !== id
        );

    saveTasks();

    render();

    showNotification(
        "Task Deleted",
        task.text
    );

}

function editTask(id) {

    const task =
        tasks.find(
            task => task.id === id
        );

    const newText =
        prompt(
            "Edit Task",
            task.text
        );

    if (
        newText &&
        newText.trim()
    ) {

        task.text =
            newText.trim();

        saveTasks();

        render();

    }

}

// ================================
// ATTACH EVENTS
// ================================

function attachEvents(
    li,
    id
) {

    const checkbox =
        li.querySelector(
            'input[type="checkbox"]'
        );

    const editBtn =
        li.querySelector(".edit-btn");

    const deleteBtn =
        li.querySelector(".delete-btn");

    checkbox.addEventListener(
        "change",
        () => toggleTask(id)
    );

    editBtn.addEventListener(
        "click",
        () => editTask(id)
    );

    deleteBtn.addEventListener(
        "click",
        () => {

            if (
                confirm(
                    "Delete task?"
                )
            ) {

                deleteTask(id);

            }

        }
    );

    // DRAGGING

    li.addEventListener(
        "dragstart",
        () => {

            li.classList.add(
                "dragging"
            );

        }
    );

    li.addEventListener(
        "dragend",
        () => {

            li.classList.remove(
                "dragging"
            );

            saveTasks();

        }
    );

}

// ================================
// DRAG & DROP
// ================================

taskList.addEventListener(
    "dragover",
    (e) => {

        e.preventDefault();

        const dragging =
            document.querySelector(
                ".dragging"
            );

        const afterElement =
            getDragAfterElement(
                taskList,
                e.clientY
            );

        if (
            afterElement == null
        ) {

            taskList.appendChild(
                dragging
            );

        } else {

            taskList.insertBefore(
                dragging,
                afterElement
            );

        }

    }
);

function getDragAfterElement(
    container,
    y
) {

    const elements =
        [...container.querySelectorAll(
            "li:not(.dragging)"
        )];

    return elements.reduce(
        (closest, child) => {

            const box =
                child.getBoundingClientRect();

            const offset =
                y -
                box.top -
                box.height / 2;

            if (
                offset < 0 &&
                offset > closest.offset
            ) {

                return {

                    offset,

                    element: child

                };

            }

            return closest;

        },

        {
            offset:
            Number.NEGATIVE_INFINITY
        }

    ).element;

}

// ================================
// SEARCH
// ================================

searchInput.addEventListener(
    "input",
    function() {

        const value =
            this.value.toLowerCase();

        document
            .querySelectorAll(
                "#taskList li"
            )
            .forEach(li => {

                const text =
                    li.querySelector(
                        ".task-text"
                    )
                    .textContent
                    .toLowerCase();

                li.style.display =
                    text.includes(value)
                    ? "flex"
                    : "none";

            });

    }
);

// ================================
// FILTERS
// ================================

filterBtns.forEach(btn => {

    btn.addEventListener(
        "click",
        function() {

            filterBtns.forEach(
                b =>
                b.classList.remove(
                    "active"
                )
            );

            this.classList.add(
                "active"
            );

            currentFilter =
                this.dataset.filter;

            render();

        }
    );

});

// ================================
// TASK COUNTER
// ================================

function updateCount() {

    const completed =
        tasks.filter(
            task =>
            task.completed
        ).length;

    taskCount.textContent =
        `${completed}/${tasks.length} Completed`;

    emptyMsg.style.display =
        tasks.length === 0
        ? "block"
        : "none";

}

// ================================
// DARK MODE
// ================================

document
.getElementById(
    "darkModeBtn"
)
.addEventListener(
    "click",
    () => {

        document.body.classList.toggle(
            "dark-mode"
        );

        localStorage.setItem(
            "darkMode",

            document.body.classList.contains(
                "dark-mode"
            )
        );

    }
);

if (
    localStorage.getItem(
        "darkMode"
    ) === "true"
) {

    document.body.classList.add(
        "dark-mode"
    );

}

// ================================
// START APP
// ================================

loadTasks();
render();