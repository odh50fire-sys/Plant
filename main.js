const { app, BrowserWindow, shell, Menu, ipcMain } = require('electron');
const path = require('path');

let mainWindow = null;

async function performHardReload() {
  if (!mainWindow) return;
  try {
    // 1) HTTP 캐시 및 자바스크립트 코드 캐시 소거
    await mainWindow.webContents.session.clearCache();
    // 2) 서비스워커 및 캐시 스토리지 소거 (주의: 사용자의 소중한 식물/일지 데이터가 저장된 localStorage는 절대 안전하게 보존)
    await mainWindow.webContents.session.clearStorageData({
      storages: ['appcache', 'serviceworkers', 'cachestorage']
    });
  } catch (err) {
    console.warn('Cache clear error:', err);
  }
  // 3) 캐시를 무시하고 최신 파일 강제 재로드
  mainWindow.webContents.reloadIgnoringCache();
}

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
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js')
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

  // 단축키 (F5, Ctrl+R, Ctrl+Shift+R) 캐시 무시 강력 새로고침 지원
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown') {
      if (input.key === 'F5' || ((input.control || input.meta) && input.key.toLowerCase() === 'r')) {
        event.preventDefault();
        performHardReload();
      }
    }
  });

  // 최초 창 로드 시에도 디스크 및 코드 캐시 소거하여 항상 100% 최신 소스 반영
  mainWindow.webContents.session.clearCache().catch(() => {});

  // index.html 로드
  mainWindow.loadFile('index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 렌더러 프로세스에서 캐시 정리 및 새로고침 요청 수신
ipcMain.on('app:clear-cache-reload', () => {
  performHardReload();
});

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
