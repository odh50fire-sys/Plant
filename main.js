const { app, BrowserWindow, shell, Menu } = require('electron');
const path = require('path');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 880,
    minWidth: 920,
    minHeight: 650,
    title: '플랜티 (Planty) - 반려식물 비서',
    icon: path.join(__dirname, 'icon.png'),
    autoHideMenuBar: true,
    show: false, // 로딩 완료 후 부드럽게 표시
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    }
  });

  // 상단 기본 메뉴바 제거 (더 깔끔한 독립 윈도우 앱 스타일)
  Menu.setApplicationMenu(null);

  // 로딩 준비되면 창 띄우기 (화면 깜빡임 방지)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // 외부 링크 (예: 위키백과 등) 클릭 시 외부 웹브라우저로 열기
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // index.html 로드
  mainWindow.loadFile('index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 단일 인스턴스 잠금 (중복 실행 방지)
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // 사용자가 두 번째 실행을 시도하면 기존 창을 포커스
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(createWindow);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}
