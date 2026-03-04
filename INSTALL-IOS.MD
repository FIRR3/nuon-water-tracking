# Steps to download
# Step 1: Build (registers device + builds)
xcodebuild \
  -workspace ios/NuonWaterTracking.xcworkspace \
  -scheme NuonWaterTracking \
  -configuration Release \
  -destination "id=<DEVICE_UDID>" \
  -allowProvisioningUpdates \
  build

# Step 2: Install
xcrun devicectl device install app \
  --device <DEVICE_UDID> \
  "$(find ~/Library/Developer/Xcode/DerivedData/NuonWaterTracking-*/Build/Products/Release-iphoneos -name 'NuonWaterTracking.app' | head -1)"