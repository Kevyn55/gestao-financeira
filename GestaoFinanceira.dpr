program GestaoFinanceira;

uses
  Windows, Messages, SysUtils, ShellAPI, WinSock;

const
  WM_TRAYICON = WM_USER + 100;
  IDM_OPEN    = 1001;
  IDM_STATUS  = 1002;
  IDM_EXIT    = 1003;

var
  NotifyIconData: TNotifyIconData;
  HAppWnd: HWND;
  HAppMenu: HMENU;
  ServerPI: TProcessInformation;
  ServerStartedByUs: Boolean = False;

function IsPortOpen(Port: Word): Boolean;
var
  WSAData: TWSAData;
  Sock: TSocket;
  Addr: TSockAddrIn;
  Res: Integer;
begin
  Result := False;
  if WSAStartup(MAKEWORD(2, 2), WSAData) <> 0 then Exit;
  Sock := socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
  if Sock <> INVALID_SOCKET then
  begin
    FillChar(Addr, SizeOf(Addr), 0);
    Addr.sin_family := AF_INET;
    Addr.sin_port := htons(Port);
    Addr.sin_addr.s_addr := inet_addr('127.0.0.1');
    Res := connect(Sock, Addr, SizeOf(Addr));
    Result := (Res = 0);
    closesocket(Sock);
  end;
  WSACleanup;
end;

procedure LaunchAppInterface;
var
  Res: THandle;
begin
  // Try launching modern App Mode with Edge (clean window, no browser tabs/URL bar)
  Res := ShellExecute(0, 'open', 'msedge.exe', '--app=http://localhost:3000', nil, SW_SHOWNORMAL);
  if Res <= 32 then
  begin
    // Fallback to Chrome App Mode
    Res := ShellExecute(0, 'open', 'chrome.exe', '--app=http://localhost:3000', nil, SW_SHOWNORMAL);
    if Res <= 32 then
    begin
      // Fallback to Default Browser
      ShellExecute(0, 'open', 'http://localhost:3000', nil, nil, SW_SHOWNORMAL);
    end;
  end;
end;

procedure StartNextServer;
var
  SI: TStartupInfo;
  CmdLine: string;
  Dir: string;
  WaitCount: Integer;
begin
  if IsPortOpen(3000) then
  begin
    Exit;
  end;

  Dir := ExtractFilePath(ParamStr(0));
  if (Length(Dir) > 0) and (Dir[Length(Dir)] = '\') then
    Delete(Dir, Length(Dir), 1);

  FillChar(SI, SizeOf(SI), 0);
  SI.cb := SizeOf(SI);
  SI.dwFlags := STARTF_USESHOWWINDOW;
  SI.wShowWindow := SW_HIDE; // Run completely invisible in background

  FillChar(ServerPI, SizeOf(ServerPI), 0);

  // Use cmd /c npm.cmd start
  CmdLine := 'cmd.exe /c npm.cmd start';

  if CreateProcess(nil, PChar(CmdLine), nil, nil, False,
                   CREATE_NO_WINDOW, nil, PChar(Dir), SI, ServerPI) then
  begin
    ServerStartedByUs := True;
  end;

  // Wait up to 15 seconds for server to start
  WaitCount := 0;
  while (WaitCount < 30) and not IsPortOpen(3000) do
  begin
    Sleep(500);
    Inc(WaitCount);
  end;
end;

procedure StopServer;
begin
  if ServerStartedByUs and (ServerPI.hProcess <> 0) then
  begin
    TerminateProcess(ServerPI.hProcess, 0);
    CloseHandle(ServerPI.hProcess);
    CloseHandle(ServerPI.hThread);
  end;
end;

function WindowProc(Wnd: HWND; Msg: UINT; WParam: WPARAM; LParam: LPARAM): LRESULT; stdcall;
var
  Pt: TPoint;
begin
  case Msg of
    WM_TRAYICON:
      begin
        if (LParam = WM_LBUTTONDBLCLK) or (LParam = WM_LBUTTONUP) then
        begin
          LaunchAppInterface;
        end
        else if LParam = WM_RBUTTONUP then
        begin
          GetCursorPos(Pt);
          SetForegroundWindow(Wnd);
          TrackPopupMenu(HAppMenu, TPM_RIGHTBUTTON or TPM_BOTTOMALIGN, Pt.X, Pt.Y, 0, Wnd, nil);
          PostMessage(Wnd, WM_NULL, 0, 0);
        end;
        Result := 0;
        Exit;
      end;
    WM_COMMAND:
      begin
        case LOWORD(WParam) of
          IDM_OPEN:
            LaunchAppInterface;
          IDM_STATUS:
            begin
              if IsPortOpen(3000) then
                MessageBox(Wnd, 'O servidor de Gestão Financeira está ativo e operando normalmente na porta 3000.', 'Status do Sistema', MB_OK or MB_ICONINFORMATION)
              else
                MessageBox(Wnd, 'O servidor está iniciando ou aguardando requisições.', 'Status do Sistema', MB_OK or MB_ICONWARNING);
            end;
          IDM_EXIT:
            begin
              DestroyWindow(Wnd);
            end;
        end;
        Result := 0;
        Exit;
      end;
    WM_DESTROY:
      begin
        Shell_NotifyIcon(NIM_DELETE, @NotifyIconData);
        DestroyMenu(HAppMenu);
        StopServer;
        PostQuitMessage(0);
        Result := 0;
        Exit;
      end;
  end;
  Result := DefWindowProc(Wnd, Msg, WParam, LParam);
end;

procedure InitTrayApp;
var
  WC: TWndClass;
  AppTitle: string;
begin
  AppTitle := 'GestorFinanceiroAppClass';

  FillChar(WC, SizeOf(WC), 0);
  WC.lpfnWndProc := @WindowProc;
  WC.hInstance := HInstance;
  WC.lpszClassName := PChar(AppTitle);
  RegisterClass(WC);

  HAppWnd := CreateWindow(PChar(AppTitle), 'Gestão Financeira & Dívidas',
                          WS_OVERLAPPEDWINDOW, 0, 0, 0, 0, 0, 0, HInstance, nil);

  HAppMenu := CreatePopupMenu;
  AppendMenu(HAppMenu, MF_STRING, IDM_OPEN, '&Abrir Painel Financeiro');
  AppendMenu(HAppMenu, MF_STRING, IDM_STATUS, '&Status do Servidor');
  AppendMenu(HAppMenu, MF_SEPARATOR, 0, nil);
  AppendMenu(HAppMenu, MF_STRING, IDM_EXIT, '&Encerrar Sistema');

  FillChar(NotifyIconData, SizeOf(NotifyIconData), 0);
  NotifyIconData.cbSize := SizeOf(TNotifyIconData);
  NotifyIconData.Wnd := HAppWnd;
  NotifyIconData.uID := 1;
  NotifyIconData.uFlags := NIF_MESSAGE or NIF_ICON or NIF_TIP;
  NotifyIconData.uCallbackMessage := WM_TRAYICON;
  NotifyIconData.hIcon := LoadIcon(0, IDI_APPLICATION);
  StrLCopy(NotifyIconData.szTip, 'Gestão Financeira & Dívidas (Online)', SizeOf(NotifyIconData.szTip) - 1);

  Shell_NotifyIcon(NIM_ADD, @NotifyIconData);
end;

var
  Msg: TMsg;
begin
  // 1. Inicia o servidor Next.js se não estiver rodando
  StartNextServer;

  // 2. Abre a interface desktop do sistema imediatamente
  LaunchAppInterface;

  // 3. Inicializa o aplicativo em bandeja do sistema
  InitTrayApp;

  // 4. Message loop
  while GetMessage(Msg, 0, 0, 0) do
  begin
    TranslateMessage(Msg);
    DispatchMessage(Msg);
  end;
end.
