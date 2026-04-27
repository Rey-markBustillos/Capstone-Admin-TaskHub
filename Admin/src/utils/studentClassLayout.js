export const getStudentClassContentClasses = (isSidebarOpen) =>
  isSidebarOpen
    ? 'md:ml-64 md:w-[calc(100%-256px)]'
    : 'md:ml-20 md:w-[calc(100%-80px)]';

export const getStudentClassHeaderPositionClasses = (isSidebarOpen) =>
  isSidebarOpen ? 'md:left-64' : 'md:left-20';

export const getStudentClassHeaderPaddingClasses = (isSidebarOpen) =>
  isSidebarOpen
    ? 'px-3 sm:px-4 md:px-8 lg:px-10 xl:px-12'
    : 'px-3 sm:px-4 md:px-6 lg:px-8';
