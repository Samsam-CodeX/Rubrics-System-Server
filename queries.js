export const groupAverage = `
SELECT
    s.groupNumber,
    ROUND(AVG(studentAverage), 2) AS groupAverage

FROM students s

LEFT JOIN (
    SELECT
        student_id,

        AVG(
            content_accuracy +
            understanding_topic +
            organization_structure +
            delivery_communication +
            audience_engagement +
            visual_aids +
            professional_appearance +
            teamwork +
            time_allocation +
            strategy
        ) AS studentAverage

    FROM ratings

    GROUP BY student_id
) AS averages

ON s.studentId = averages.student_id

GROUP BY s.groupNumber

ORDER BY s.groupNumber;
`;



export const studentInfo = `
SELECT
    s.studentId,
    CONCAT(s.firstName, ' ', s.lastName) AS fullName,
    s.groupNumber,
    ROUND(averages.studentAverage, 2) AS studentAverage

FROM students s

LEFT JOIN (
    SELECT
        student_id,
        AVG(
            content_accuracy +
            understanding_topic +
            organization_structure +
            delivery_communication +
            audience_engagement +
            visual_aids +
            professional_appearance +
            teamwork +
            time_allocation +
            strategy
        ) AS studentAverage

    FROM ratings

    GROUP BY student_id
) AS averages

ON s.studentId = averages.student_id

ORDER BY
    s.groupNumber,
    s.studentId;
`;