/*
 * @Author: Mx.Peng
 * @Date: 2025-08-26 13:58:10
 * @LastEditors: Mx.Peng
 * @LastEditTime: 2026-02-03 00:00:00
 * @Description: Enhanced TodoList with filter, edit, and counter functionality, now connected to backend API
 */

/**
 * @file app.js
 * @description Enhanced to-do list application with filtering, editing, task counter,
 * and improved user experience with animations. Now connects to backend API.
 * Refactored to use TodoApp class with encapsulation.
 */

class TodoApp {
  constructor() {
    this._elements = {};
    this._currentFilter = 'all';
    this._apiBaseUrl = 'http://localhost:5000/api';

    this._initElements();
    this._bindEvents();
    this.loadTodos();
  }

  /**
   * 初始化并缓存所有 DOM 元素引用
   * @private
   */
  _initElements() {
    this._elements = {
      todoInput: document.getElementById("todo-input"),
      addTodoButton: document.getElementById("add-todo"),
      clearAllButton: document.getElementById("clear-all"),
      clearCompletedButton: document.getElementById("clear-completed"),
      todoList: document.getElementById("todo-list"),
      taskCountEl: document.getElementById("task-count"),
      filterButtons: document.querySelectorAll(".filter-btn"),
      loadingBar: document.getElementById("loading-bar"),
      toastContainer: document.getElementById("toast-container")
    };
  }

  /**
   * 绑定所有事件监听器
   * @private
   */
  _bindEvents() {
    // 将在任务 9 中实现
  }

  /**
   * 格式化时间显示
   * @function formatTime
   * @param {string} isoString - ISO格式的时间字符串
   * @returns {string} 格式化后的时间字符串
   */
  formatTime(isoString) {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }

  /**
   * 格式化完成时间为易读的字符串。
   * @function formatCompletedTime
   * @param {number} timestamp - 时间戳（毫秒）
   * @returns {string} 格式化后的时间字符串
   */
  formatCompletedTime(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `完成于 ${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * 从后端API获取所有待办事项
   * @function loadTodos
   * @returns {Promise<void>}
   */
  async loadTodos() {
    try {
      const response = await fetch(`${this._apiBaseUrl}/todos`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const todos = await response.json();

      // 清空当前列表
      this._elements.todoList.innerHTML = "";

      // 重建任务列表
      todos.forEach((taskObject) => {
        this.createTodoElement(
          taskObject.title,
          taskObject.completed,
          taskObject.completed ? new Date(taskObject.created_at).getTime() : null,
          taskObject.created_at
        );
      });

      this.updateTaskCounter();
      this.applyFilter();
    } catch (error) {
      console.error('Error loading todos:', error);
      alert('加载待办事项失败，请检查后端服务是否正常运行');
    }
  }

  /**
   * 保存待办事项到后端API
   * @function saveTodo
   * @param {Object} todoData - 待办事项数据
   * @returns {Promise<Object>} 保存后的待办事项对象
   */
  async saveTodo(todoData) {
    try {
      const response = await fetch(`${this._apiBaseUrl}/todos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(todoData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving todo:', error);
      alert('保存待办事项失败');
      throw error;
    }
  }

  /**
   * 更新待办事项到后端API
   * @function updateTodo
   * @param {number} id - 待办事项ID
   * @param {Object} todoData - 待办事项数据
   * @returns {Promise<Object>} 更新后的待办事项对象
   */
  async updateTodo(id, todoData) {
    try {
      const response = await fetch(`${this._apiBaseUrl}/todos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(todoData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating todo:', error);
      alert('更新待办事项失败');
      throw error;
    }
  }

  /**
   * 从后端API删除待办事项
   * @function deleteTodo
   * @param {number} id - 待办事项ID
   * @returns {Promise<Object>} 删除操作的结果
   */
  async deleteTodo(id) {
    try {
      const response = await fetch(`${this._apiBaseUrl}/todos/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting todo:', error);
      alert('删除待办事项失败');
      throw error;
    }
  }

  /**
   * 从输入框获取文本并添加新的待办事项。
   * 包含空值检查、DOM创建调用、后端同步和UI更新。
   * @function addTodo
   * @returns {void}
   */
  async addTodo() {
    const todoText = this._elements.todoInput.value.trim();
    if (todoText === "") {
      alert("请输入待办事项");
      return;
    }

    const createdAt = new Date().toISOString();

    try {
      // 先保存到后端
      const newTodo = await this.saveTodo({
        title: todoText,
        description: ''
      });

      // 成功后更新UI
      this.createTodoElement(todoText, false, null, newTodo.created_at);
      this._elements.todoInput.value = "";
      this.updateTaskCounter();
      this.applyFilter();
    } catch (error) {
      console.error('Failed to add todo:', error);
    }
  }

  /**
   * 动态创建待办事项的DOM结构。
   * 包含文本内容、编辑输入框、编辑/删除按钮以及相关事件绑定。
   * @function createTodoElement
   * @param {string} text - 待办事项的具体显示文本
   * @param {boolean} [completed=false] - 初始状态是否为已完成
   * @param {number|null} [completedTime=null] - 任务完成时间戳
   * @param {string|null} [createdAt=null] - 任务创建时间（ISO格式）
   * @returns {void}
   */
  createTodoElement(text, completed = false, completedTime = null, createdAt = null) {
    const li = document.createElement("li");
    li.dataset.taskText = text;
    if (createdAt) {
      li.dataset.createdAt = createdAt;
    }
    if (completed) {
      li.classList.add("completed");
    }
    if (completedTime) {
      li.dataset.completedTime = completedTime;
    }

    // 创建主行容器
    const rowDiv = document.createElement("div");
    rowDiv.className = "todo-item-row";

    // 创建内容区域
    const contentDiv = document.createElement("div");
    contentDiv.className = "todo-content";
    contentDiv.textContent = text;
    rowDiv.appendChild(contentDiv);

    // 创建编辑输入框（隐藏状态）
    const editInput = document.createElement("input");
    editInput.type = "text";
    editInput.className = "edit-input";
    editInput.value = text;
    rowDiv.appendChild(editInput);

    // 创建按钮容器
    const buttonsDiv = document.createElement("div");
    buttonsDiv.className = "todo-buttons";

    // 编辑按钮
    const editButton = document.createElement("button");
    editButton.textContent = "编辑";
    editButton.className = "edit-btn";
    editButton.addEventListener("click", (e) => {
      e.stopPropagation();
      this.enterEditMode(li, editInput);
    });
    buttonsDiv.appendChild(editButton);

    // 删除按钮
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "删除";
    deleteButton.addEventListener("click", async (e) => {
      e.stopPropagation();

      // 从后端删除
      try {
        // 获取待删除项的ID（这里需要一种方法来标识后端的ID）
        const todoId = li.dataset.todoId;
        if (todoId) {
          await this.deleteTodo(parseInt(todoId));
        }

        // 从UI中移除
        li.remove();
        this.updateTaskCounter();
        this.applyFilter();
      } catch (error) {
        console.error('Failed to delete todo:', error);
      }
    });
    buttonsDiv.appendChild(deleteButton);

    rowDiv.appendChild(buttonsDiv);

    // 创建编辑操作按钮（隐藏状态）
    const editActionsDiv = document.createElement("div");
    editActionsDiv.className = "edit-actions";

    const saveButton = document.createElement("button");
    saveButton.textContent = "保存";
    saveButton.className = "save-btn";
    saveButton.addEventListener("click", async (e) => {
      e.stopPropagation();
      await this.saveEdit(li, editInput, contentDiv);
    });
    editActionsDiv.appendChild(saveButton);

    const cancelButton = document.createElement("button");
    cancelButton.textContent = "取消";
    cancelButton.className = "cancel-btn";
    cancelButton.addEventListener("click", (e) => {
      e.stopPropagation();
      this.cancelEdit(li, editInput);
    });
    editActionsDiv.appendChild(cancelButton);

    rowDiv.appendChild(editActionsDiv);

    li.appendChild(rowDiv);

    // 创建时间信息容器
    const metaDiv = document.createElement("div");
    metaDiv.className = "todo-meta";

    // 创建创建时间显示
    if (createdAt) {
      const createdAtDiv = document.createElement("div");
      createdAtDiv.className = "todo-time";
      createdAtDiv.textContent = this.formatTime(createdAt);
      metaDiv.appendChild(createdAtDiv);
    }

    // 创建完成时间显示区域
    const timeDiv = document.createElement("div");
    timeDiv.className = "completed-time";
    if (completed && completedTime) {
      timeDiv.textContent = this.formatCompletedTime(completedTime);
      timeDiv.style.display = "block";
    } else {
      timeDiv.style.display = "none";
    }
    metaDiv.appendChild(timeDiv);

    li.appendChild(metaDiv);

    // 点击切换完成状态（不在编辑模式时）
    contentDiv.addEventListener("click", async () => {
      if (!li.classList.contains("editing")) {
        const wasCompleted = li.classList.contains("completed");
        li.classList.toggle("completed");

        // 如果从未完成变为完成，记录完成时间
        if (!wasCompleted && li.classList.contains("completed")) {
          const now = Date.now();
          li.dataset.completedTime = now;
          timeDiv.textContent = this.formatCompletedTime(now);
          timeDiv.style.display = "block";
        } else if (wasCompleted && !li.classList.contains("completed")) {
          // 如果从完成变为未完成，清除完成时间
          delete li.dataset.completedTime;
          timeDiv.textContent = "";
          timeDiv.style.display = "none";
        }

        // 更新后端数据
        try {
          const todoId = li.dataset.todoId;
          if (todoId) {
            await this.updateTodo(parseInt(todoId), {
              title: li.dataset.taskText,
              description: '',
              completed: li.classList.contains("completed")
            });
          }
        } catch (error) {
          console.error('Failed to update todo completion status:', error);
          // 如果更新失败，回滚UI状态
          li.classList.toggle("completed");
        }

        this.updateTaskCounter();
        this.applyFilter();
      }
    });

    this._elements.todoList.appendChild(li);
  }

  /**
   * 切换指定任务项进入编辑模式。
   * 显示输入框，隐藏静态文本，并自动聚焦到输入框中。
   * @function enterEditMode
   * @param {HTMLElement} li - 目标列表项元素
   * @param {HTMLInputElement} editInput - 该项关联的编辑输入框元素
   * @returns {void}
   */
  enterEditMode(li, editInput) {
    li.classList.add("editing");
    editInput.focus();
    editInput.select();
  }

  /**
   * 保存编辑后的文本并退出编辑模式。
   * 包含空值校验，校验通过后同步更新DOM文本和数据集。
   * @function saveEdit
   * @param {HTMLElement} li - 目标列表项元素
   * @param {HTMLInputElement} editInput - 编辑输入框元素
   * @param {HTMLElement} contentDiv - 显示任务内容的容器元素
   * @returns {Promise<void>}
   */
  async saveEdit(li, editInput, contentDiv) {
    const newText = editInput.value.trim();
    if (newText === "") {
      alert("待办事项不能为空");
      return;
    }

    try {
      // 更新后端数据
      const todoId = li.dataset.todoId;
      if (todoId) {
        const updatedTodo = await this.updateTodo(parseInt(todoId), {
          title: newText,
          description: '',
          completed: li.classList.contains("completed")
        });

        // 成功后更新UI
        li.dataset.taskText = newText;
        contentDiv.textContent = newText;
        editInput.value = newText;
        li.classList.remove("editing");
        this.updateTaskCounter();
      }
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  }

  /**
   * 放弃编辑并恢复之前的任务文本。
   * 退出编辑模式并还原输入框的值。
   * @function cancelEdit
   * @param {HTMLElement} li - 目标列表项元素
   * @param {HTMLInputElement} editInput - 编辑输入框元素
   * @returns {void}
   */
  cancelEdit(li, editInput) {
    editInput.value = li.dataset.taskText;
    li.classList.remove("editing");
  }

  /**
   * 重新统计并更新界面上的任务状态计数器。
   * 计算总数、进行中数量和已完成数量，并格式化显示文本。
   * @function updateTaskCounter
   * @returns {void}
   */
  updateTaskCounter() {
    const allTasks = this._elements.todoList.querySelectorAll("li");
    const activeTasks = Array.from(allTasks).filter(
      (task) => !task.classList.contains("completed")
    );
    const completedTasks = allTasks.length - activeTasks.length;

    this._elements.taskCountEl.textContent = `共 ${allTasks.length} 个任务 (进行中: ${activeTasks.length}, 已完成: ${completedTasks})`;
  }

  /**
   * 根据当前选中的过滤器（全部、进行中、已完成）显示或隐藏任务项。
   * 通过操作 CSS 类名 'hidden' 来控制元素的可见性。
   * @function applyFilter
   * @returns {void}
   */
  applyFilter() {
    const allTasks = this._elements.todoList.querySelectorAll("li");

    allTasks.forEach((task) => {
      task.classList.remove("hidden");

      if (this._currentFilter === "active" && task.classList.contains("completed")) {
        task.classList.add("hidden");
      } else if (this._currentFilter === "completed" && !task.classList.contains("completed")) {
        task.classList.add("hidden");
      }
    });
  }

  /**
   * 清空所有待办事项列表。
   * 包含操作确认提示，并在清除后同步移除后端数据及更新 UI。
   * @function clearAllTodos
   * @returns {void}
   */
  async clearAllTodos() {
    if (this._elements.todoList.children.length === 0) {
      alert("当前没有任务需要清除");
      return;
    }

    if (confirm("确定要清除所有待办事项吗？")) {
      // 从后端清空所有任务
      const allTaskElements = Array.from(this._elements.todoList.querySelectorAll("li"));
      const deletePromises = allTaskElements.map(async (taskElement) => {
        const todoId = taskElement.dataset.todoId;
        if (todoId) {
          return this.deleteTodo(parseInt(todoId));
        }
      });

      try {
        await Promise.all(deletePromises);
        // 成功后清空UI
        this._elements.todoList.innerHTML = "";
        this.updateTaskCounter();
      } catch (error) {
        console.error('Failed to clear all todos:', error);
        alert('清空待办事项失败');
      }
    }
  }

  /**
   * 仅删除状态为已完成的任务项。
   * 包含操作确认提示，删除后同步更新后端并重新应用当前过滤器。
   * @function clearCompletedTodos
   * @returns {void}
   */
  async clearCompletedTodos() {
    const completedTasks = this._elements.todoList.querySelectorAll("li.completed");

    if (completedTasks.length === 0) {
      alert("当前没有已完成的任务");
      return;
    }

    if (confirm(`确定要清除 ${completedTasks.length} 个已完成的待办事项吗？`)) {
      // 从后端删除所有已完成的任务
      const deletePromises = Array.from(completedTasks).map(async (taskElement) => {
        const todoId = taskElement.dataset.todoId;
        if (todoId) {
          return this.deleteTodo(parseInt(todoId));
        }
      });

      try {
        await Promise.all(deletePromises);
        // 成功后从UI中移除
        completedTasks.forEach(task => task.remove());
        this.updateTaskCounter();
        this.applyFilter();
      } catch (error) {
        console.error('Failed to clear completed todos:', error);
        alert('清空已完成待办事项失败');
      }
    }
  }
}

// 初始化应用
document.addEventListener("DOMContentLoaded", () => {
  new TodoApp();
});
