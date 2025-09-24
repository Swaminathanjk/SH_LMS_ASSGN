import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Student,
  SubjectData,
  ChapterProgress,
  WorkItem,
  Doubt,
} from "./types";
import StudentCard from "./components/StudentCard";
import StudentDrawer from "./components/StudentDrawer";
import StudentForm from "./components/StudentForm";
import FilterBar from "./components/FilterBar";
import SubjectManagerPage from "./components/SubjectManagerPage";
import SyllabusProgressPage from "./components/SyllabusProgressPage";
import WorkPoolPage from "./components/WorkPoolPage";
import DoubtBoxPage from "./components/DoubtBoxPage";
import Sidebar from "./components/layout/Sidebar";
import { updateDoubtStatusFromWorkItems } from "./utils/workPoolService";

import { db } from "./firebase/firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

type Page = "students" | "subjects" | "syllabus" | "work-pool" | "doubts";

const App: React.FC = () => {
  // State management
  const [students, setStudents] = useState<Student[]>([]);
  const [allStudentSubjects, setAllStudentSubjects] = useState<{
    [key: string]: { studentId: string; subjects: SubjectData[] };
  }>({});
  const [chapterProgress, setChapterProgress] = useState<ChapterProgress[]>([]);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<Partial<Student> | null>(
    null
  );
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [filters, setFilters] = useState({ board: "", grade: "", batch: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState<Page>("students");
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  // Fetch data from Firestore on component mount
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "students"));
        const studentsData: Student[] = querySnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Student)
        );
        setStudents(studentsData);
      } catch (error) {
        console.error("Failed to fetch students from Firestore:", error);
      }
    };

    fetchStudents();
  }, []);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "studentSubjects"));
        const subjectsData: {
          [key: string]: { studentId: string; subjects: SubjectData[] };
        } = {};

        querySnapshot.forEach((docSnap) => {
          subjectsData[docSnap.id] = docSnap.data() as {
            studentId: string;
            subjects: SubjectData[];
          };
        });

        setAllStudentSubjects(subjectsData);
      } catch (error) {
        console.error("Failed to fetch subjects from Firestore:", error);
      }
    };

    fetchSubjects();
  }, []);

  useEffect(() => {
    const fetchChapterProgress = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "chapterProgress"));
        const progressData: ChapterProgress[] = querySnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as ChapterProgress)
        );
        setChapterProgress(progressData);
      } catch (error) {
        console.error(
          "Failed to fetch chapter progress from Firestore:",
          error
        );
      }
    };

    fetchChapterProgress();
  }, []);

  useEffect(() => {
    const fetchWorkItems = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "workItems"));
        const workItemsData: WorkItem[] = querySnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as WorkItem)
        );
        setWorkItems(workItemsData);
      } catch (error) {
        console.error("Failed to fetch work items from Firestore:", error);
      }
    };

    fetchWorkItems();
  }, []);

  useEffect(() => {
    const fetchDoubts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "doubts"));
        const doubtsData: Doubt[] = querySnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Doubt)
        );
        setDoubts(doubtsData);
      } catch (error) {
        console.error("Failed to fetch doubts from Firestore:", error);
      }
    };

    fetchDoubts();
  }, []);

  // Update doubt statuses based on work items
  useEffect(() => {
    if (doubts.length === 0) return;

    let hasChanges = false;
    const newDoubts = doubts.map((doubt) => {
      const updatedDoubt = updateDoubtStatusFromWorkItems(doubt, workItems);
      if (updatedDoubt.status !== doubt.status) {
        hasChanges = true;
      }
      return updatedDoubt;
    });

    if (hasChanges) {
      setDoubts(newDoubts);
      // Save updated doubts to Firestore
      newDoubts.forEach(async (doubt) => {
        try {
          const doubtRef = doc(db, "doubts", doubt.id);
          await setDoc(doubtRef, doubt);
        } catch (error) {
          console.error("Failed to update doubt in Firestore:", error);
        }
      });
    }
  }, [workItems]);

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Event handlers
  const handleSaveStudent = useCallback(async (studentData: Student) => {
    setStudents((prev) => {
      const existing = prev.find((s) => s.id === studentData.id);
      return existing
        ? prev.map((s) => (s.id === studentData.id ? studentData : s))
        : [...prev, studentData];
    });
    setEditingStudent(null);
    setViewingStudent(studentData);

    try {
      const studentRef = doc(db, "students", studentData.id);
      await setDoc(studentRef, studentData);
      console.log("Student saved to Firestore:", studentData.id);
    } catch (error) {
      console.error("Failed to save student to Firestore:", error); 
    }
  }, []);

  const handleSaveSubjects = useCallback(
    async (studentId: string, subjects: SubjectData[]) => {
      setAllStudentSubjects((prev) => ({
        ...prev,
        [studentId]: { studentId, subjects },
      }));

      try {
        const docRef = doc(db, "studentSubjects", studentId);
        await setDoc(docRef, { studentId, subjects });
        console.log("Subjects saved to Firestore for student:", studentId);
      } catch (error) {
        console.error("Failed to save subjects to Firestore:", error);
      }
    },
    []
  );

  const handleSaveChapterProgress = useCallback(
    async (progress: ChapterProgress) => {
      const oldProgress = chapterProgress.find((p) => p.id === progress.id);
      const oldEntries = oldProgress?.entries ?? [];
      const oldEntryIds = new Set(oldEntries.map((e) => e.id));

      const newEntries = progress.entries;
      const newEntryIds = new Set(newEntries.map((e) => e.id));

      //   // Logic for adding a work item
      //   const addedEntries = newEntries.filter((e) => !oldEntryIds.has(e.id));
      //   const newStartEntry = addedEntries.find((e) => e.type === "start");

      //   if (newStartEntry) {
      //     const workAlreadyExists = workItems.some(
      //       (item) =>
      //         item.source === "syllabus" &&
      //         item.studentId === progress.studentId &&
      //         item.subject === progress.subject &&
      //         item.chapterNo === progress.chapterNo &&
      //         item.title ===
      //           `Start reading & note making for ${progress.chapterName}`
      //     );

      //     if (!workAlreadyExists) {
      //       const dueDate = new Date(newStartEntry.date);
      //       dueDate.setDate(dueDate.getDate() + 7);

      //       const newWorkItem: WorkItem = {
      //         id: `w_${Date.now()}`,
      //         studentId: progress.studentId,
      //         title: `Start reading & note making for ${progress.chapterName}`,
      //         subject: progress.subject,
      //         chapterNo: progress.chapterNo,
      //         chapterName: progress.chapterName,
      //         topic: null,
      //         description:
      //           "Begin reading and making notes as the chapter has started in school.",
      //         dueDate: dueDate.toISOString().split("T")[0],
      //         status: "Assign",
      //         priority: "Low",
      //         links: null,
      //         files: null,
      //         mentorNote: null,
      //         dateCreated: new Date().toISOString().split("T")[0],
      //         source: "syllabus",
      //         linkedDoubtId: null,
      //       };

      //       setWorkItems((prev) => [...prev, newWorkItem]);

      //       try {
      //         const workItemRef = doc(db, "workItems", newWorkItem.id);
      //         await setDoc(workItemRef, newWorkItem);
      //         console.log("Work item saved to Firestore:", newWorkItem.id);
      //       } catch (error) {
      //         console.error("Failed to save work item to Firestore:", error);
      //       }
      //     }
      //   }

      // Logic for removing a work item
      //   const removedEntries = oldEntries.filter((e) => !newEntryIds.has(e.id));
      //   const removedStartEntry = removedEntries.find((e) => e.type === "start");

      //   if (removedStartEntry) {
      //     const workItemToRemove = workItems.find(
      //       (item) =>
      //         item.source === "syllabus" &&
      //         item.studentId === progress.studentId &&
      //         item.subject === progress.subject &&
      //         item.chapterNo === progress.chapterNo &&
      //         item.title ===
      //           `Start reading & note making for ${progress.chapterName}`
      //     );

      //     if (workItemToRemove) {
      //       setWorkItems((prev) =>
      //         prev.filter((item) => item.id !== workItemToRemove.id)
      //       );

      //       try {
      //         const workItemRef = doc(db, "workItems", workItemToRemove.id);
      //         await deleteDoc(workItemRef);
      //         console.log(
      //           "Work item deleted from Firestore:",
      //           workItemToRemove.id
      //         );
      //       } catch (error) {
      //         console.error("Failed to delete work item from Firestore:", error);
      //       }
      //     }
      //   }

      // Update chapter progress state
      setChapterProgress((prev) => {
        const index = prev.findIndex((p) => p.id === progress.id);
        if (index > -1) {
          const newProgressList = [...prev];
          if (progress.entries.length === 0) {
            newProgressList.splice(index, 1);
          } else {
            newProgressList[index] = { ...progress };
          }
          return newProgressList;
        } else if (progress.entries.length > 0) {
          return [...prev, progress];
        }
        return prev;
      });

      // Save chapter progress to Firestore
      try {
        if (progress.entries.length === 0) {
          const progressRef = doc(db, "chapterProgress", progress.id);
          await deleteDoc(progressRef);
          console.log("Chapter progress deleted from Firestore:", progress.id);
        } else {
          const progressRef = doc(db, "chapterProgress", progress.id);
          await setDoc(progressRef, progress);
          console.log("Chapter progress saved to Firestore:", progress.id);
        }
      } catch (error) {
        console.error("Failed to save chapter progress to Firestore:", error);
      }
    },
    [chapterProgress, workItems]
  );

  const handleSaveWorkItem = useCallback(async (workItem: WorkItem) => {
    setWorkItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === workItem.id);
      if (existingIndex > -1) {
        const newItems = [...prev];
        newItems[existingIndex] = workItem;
        return newItems;
      }
      return [...prev, workItem];
    });

    try {
      const workItemRef = doc(db, "workItems", workItem.id);
      await setDoc(workItemRef, workItem);
      console.log("Work item saved to Firestore:", workItem.id);
    } catch (error) {
      console.error("Failed to save work item to Firestore:", error);
    }
  }, []);

  const handleDeleteWorkItem = useCallback(async (workItemId: string) => {
    setWorkItems((prev) => prev.filter((item) => item.id !== workItemId));

    try {
      const workItemRef = doc(db, "workItems", workItemId);
      await deleteDoc(workItemRef);
      console.log("Work item deleted from Firestore:", workItemId);
    } catch (error) {
      console.error("Failed to delete work item from Firestore:", error);
    }
  }, []);

  const handleSaveDoubt = useCallback(async (doubt: Doubt) => {
    setDoubts((prev) => {
      const existingIndex = prev.findIndex((d) => d.id === doubt.id);
      if (existingIndex > -1) {
        const newDoubts = [...prev];
        newDoubts[existingIndex] = doubt;
        return newDoubts;
      }
      return [...prev, doubt];
    });

    try {
      const doubtRef = doc(db, "doubts", doubt.id);
      await setDoc(doubtRef, doubt);
      console.log("Doubt saved to Firestore:", doubt.id);
    } catch (error) {
      console.error("Failed to save doubt to Firestore:", error);
    }
  }, []);

  const handleDeleteDoubt = useCallback(
    async (doubtId: string) => {
      // Find if the doubt being deleted has a linked work task
      const linkedWorkItem = workItems.find(
        (item) => item.linkedDoubtId === doubtId && item.source === "doubt"
      );

      // If a task is found, delete it as well
      if (linkedWorkItem) {
        setWorkItems((prev) =>
          prev.filter((item) => item.id !== linkedWorkItem.id)
        );

        try {
          const workItemRef = doc(db, "workItems", linkedWorkItem.id);
          await deleteDoc(workItemRef);
          console.log(
            "Linked work item deleted from Firestore:",
            linkedWorkItem.id
          );
        } catch (error) {
          console.error(
            "Failed to delete linked work item from Firestore:",
            error
          );
        }
      }

      // Delete the doubt itself
      setDoubts((prev) => prev.filter((d) => d.id !== doubtId));

      try {
        const doubtRef = doc(db, "doubts", doubtId);
        await deleteDoc(doubtRef);
        console.log("Doubt deleted from Firestore:", doubtId);
      } catch (error) {
        console.error("Failed to delete doubt from Firestore:", error);
      }
    },
    [workItems]
  );

  const handleArchive = useCallback(
    async (id: string) => {
      const student = students.find((s) => s.id === id);
      if (student) {
        const updatedStudent = { ...student, isArchived: !student.isArchived };

        setStudents((prev) =>
          prev.map((s) => (s.id === id ? updatedStudent : s))
        );
        setViewingStudent(null);

        try {
          const studentRef = doc(db, "students", id);
          await updateDoc(studentRef, {
            isArchived: updatedStudent.isArchived,
          });
          console.log("Student archive status updated in Firestore:", id);
        } catch (error) {
          console.error(
            "Failed to update student archive status in Firestore:",
            error
          );
        }
      }
    },
    [students]
  );

  const handleDelete = useCallback(async (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    setViewingStudent(null);

    try {
      const studentRef = doc(db, "students", id);
      await deleteDoc(studentRef);
      console.log("Student deleted from Firestore:", id);
    } catch (error) {
      console.error("Failed to delete student from Firestore:", error);
    }
  }, []);

  const handleFilterChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFilters((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    []
  );

  const clearFilters = useCallback(() => {
    setFilters({ board: "", grade: "", batch: "" });
    setSearchQuery("");
  }, []);

  const handleCardClick = (student: Student) => {
    setViewingStudent(student);
  };

  // Computed values
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      if (student.isArchived !== showArchived) return false;
      if (filters.board && student.board !== filters.board) return false;
      if (filters.grade && student.grade.toString() !== filters.grade)
        return false;
      if (filters.batch && student.batch !== filters.batch) return false;
      if (
        searchQuery &&
        !student.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    });
  }, [students, showArchived, filters, searchQuery]);

  // Render functions
  const renderPageContent = () => {
    switch (currentPage) {
      case "subjects":
        return (
          <SubjectManagerPage
            students={students}
            allStudentSubjects={allStudentSubjects}
            onSaveSubjects={handleSaveSubjects}
          />
        );
      case "syllabus":
        return (
          <SyllabusProgressPage
            students={students}
            allStudentSubjects={allStudentSubjects}
            chapterProgress={chapterProgress}
            onSaveChapterProgress={handleSaveChapterProgress}
          />
        );
      case "work-pool":
        return (
          <WorkPoolPage
            students={students}
            allStudentSubjects={allStudentSubjects}
            workItems={workItems}
            onSaveWorkItem={handleSaveWorkItem}
            onDeleteWorkItem={handleDeleteWorkItem}
          />
        );
      case "doubts":
        return (
          <DoubtBoxPage
            students={students}
            allStudentSubjects={allStudentSubjects}
            workItems={workItems}
            doubts={doubts}
            onSaveDoubt={handleSaveDoubt}
            onDeleteDoubt={handleDeleteDoubt}
            onSaveWorkItem={handleSaveWorkItem}
          />
        );
      case "students":
      default:
        return (
          <>
            <FilterBar
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={clearFilters}
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
            />
            <div className="flex items-center mb-4 mt-6">
              <input
                type="checkbox"
                id="showArchived"
                checked={showArchived}
                onChange={() => setShowArchived(!showArchived)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label
                htmlFor="showArchived"
                className="ml-2 block text-sm text-gray-900 dark:text-gray-300"
              >
                Show Archived Students
              </label>
            </div>
            {filteredStudents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredStudents.map((student) => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    onClick={handleCardClick}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                <h3 className="text-xl font-semibold">
                  No {showArchived ? "archived" : "active"} students found.
                </h3>
                <p>Try adjusting your search or filters.</p>
              </div>
            )}
          </>
        );
    }
  };

  const getPageTitle = () => {
    switch (currentPage) {
      case "subjects":
        return "Subject Manager";
      case "syllabus":
        return "Syllabus Progress";
      case "work-pool":
        return "Work Pool";
      case "doubts":
        return "Doubt Box";
      case "students":
      default:
        return "Student Directory";
    }
  };

  return (
    <div className="relative min-h-screen">
      <Sidebar
        isExpanded={isSidebarExpanded}
        onHover={setIsSidebarExpanded}
        currentPage={currentPage}
        onNavigate={setCurrentPage}
      />
      <div
        className="flex-grow transition-all duration-300"
        style={{ marginLeft: isSidebarExpanded ? "220px" : "60px" }}
      >
        <header className="flex justify-between items-center h-20 px-8">
          <h1 className="text-2xl font-bold">{getPageTitle()}</h1>
          <div className="flex items-center space-x-4">
            {currentPage === "students" && (
              <button
                onClick={() => setEditingStudent({})}
                className="bg-brand-blue text-white h-10 px-4 rounded-md hover:bg-blue-600 transition-colors text-sm font-semibold"
              >
                + Add Student
              </button>
            )}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-lg"
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
          </div>
        </header>
        <main className="p-8 pt-0">{renderPageContent()}</main>
      </div>

      {editingStudent && (
        <StudentForm
          student={editingStudent}
          onSave={handleSaveStudent}
          onCancel={() => setEditingStudent(null)}
        />
      )}

      {viewingStudent && (
        <StudentDrawer
          student={viewingStudent}
          onClose={() => setViewingStudent(null)}
          onEdit={(student) => {
            setViewingStudent(null);
            setEditingStudent(student);
          }}
          onArchive={handleArchive}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default App;
