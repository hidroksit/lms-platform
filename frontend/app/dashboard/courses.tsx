'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Course {
    id: number;
    title: string;
    description: string;
    User: {
        firstName: string;
        lastName: string;
    };
}

export default function CoursesPage() {
    const router = useRouter();
    const [courses, setCourses] = useState<Course[]>([]);

    useEffect(() => {
        fetch('http://localhost:3001/api/courses')
            .then(res => res.json())
            .then(data => setCourses(data))
            .catch(err => console.error(err));
    }, []);

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
                <div
                    key={course.id}
                    onClick={() => router.push(`/dashboard/courses/${course.id}`)}
                    className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition-shadow duration-200"
                >
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">{course.title}</h3>
                        <p className="mt-1 text-sm text-gray-500">{course.description}</p>
                        <p className="mt-2 text-xs text-gray-400">Eğitmen: {course.User?.firstName} {course.User?.lastName}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
