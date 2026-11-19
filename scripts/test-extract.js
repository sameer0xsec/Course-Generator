
// Logic from DashboardCourseView.jsx
const extractString = (val) => {
    if (!val) return '';
    if (typeof val === 'string') {
        try {
            if (val.trim().startsWith('{')) {
                const parsed = JSON.parse(val);
                return extractString(parsed);
            }
        } catch (e) { }
        return val;
    }
    if (typeof val === 'object') {
        return extractString(val.content);
    }
    return String(val);
};

// Test Cases
const inputs = [
    { name: 'Simple String', val: '## Hello World' },
    { name: 'Stringified JSON', val: '{"content": "## Hello World"}' },
    { name: 'Object', val: { content: '## Hello World' } },
    { name: 'Nested Object', val: { content: { content: '## Hello World' } } },
    { name: 'Deeply Nested', val: { content: { content: { content: '## Hello World' } } } },
    { name: 'Stringified Nested', val: '{"content": {"content": "## Hello World"}}' },
    { name: 'Empty Object', val: {} },
    { name: 'Null', val: null },
    { name: 'Undefined', val: undefined },
    { name: 'Array (weird)', val: ['## Hello'] }, // Arrays are objects, val.content is undefined -> ''
];

inputs.forEach(input => {
    const result = extractString(input.val);
    console.log(`[${input.name}] Result: '${result}'`);
});
