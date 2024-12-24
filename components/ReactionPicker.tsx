import data, { EmojiMartData } from '@emoji-mart/data';
import React, { useCallback, useRef, useState } from 'react';
import { FlatList, Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import PagerView from 'react-native-pager-view';

interface ReactionPickerProps {
  isVisible: boolean;
  onClose: () => void;
  onEmojiSelect: (emoji: string) => void;
}

const emojiData = data as EmojiMartData;

const categories = emojiData.categories.filter((cat) =>
  ['people', 'nature', 'foods', 'activity', 'places', 'objects', 'symbols'].includes(cat.id),
);

const allCategoryEmojis = categories.map((category) => ({
  categoryId: category.id,
  emojis: category.emojis
    .map((emojiId) => emojiData.emojis[emojiId])
    .filter((emoji) => emoji != null),
}));

const categoryNames: Record<string, string> = {
  people: '人物',
  nature: '自然',
  foods: '食物',
  activity: '活动',
  places: '地点',
  objects: '物品',
  symbols: '符号',
};

const EMOJI_ITEM_SIZE = {
  width: '16.66%' as const,
  height: 50,
};

const getItemLayout = (_: ArrayLike<data.Emoji> | null | undefined, index: number) => ({
  length: EMOJI_ITEM_SIZE.height,
  offset: EMOJI_ITEM_SIZE.height * Math.floor(index / 6),
  index,
});

const EmojiItem = React.memo(
  ({
    emoji,
    onEmojiSelect,
  }: {
    emoji: EmojiMartData['emojis'][string];
    onEmojiSelect: (emoji: string) => void;
  }) => (
    <TouchableOpacity
      style={{
        width: EMOJI_ITEM_SIZE.width,
        height: EMOJI_ITEM_SIZE.height,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
      }}
      onPress={() => onEmojiSelect(emoji.skins[0].native)}
    >
      <Text style={{ fontSize: 24 }}>{emoji.skins[0].native}</Text>
    </TouchableOpacity>
  ),
);
EmojiItem.displayName = 'EmojiItem';

const ReactionList = React.memo(
  ({
    pagerRef,
    setSelectedCategory,
    onEmojiSelect,
  }: {
    pagerRef: React.RefObject<PagerView>;
    setSelectedCategory: (category: string) => void;
    onEmojiSelect: (emoji: string) => void;
  }) => {
    const renderItem = useCallback(
      ({ item: emoji }: { item: EmojiMartData['emojis'][string] }) => (
        <EmojiItem emoji={emoji} onEmojiSelect={onEmojiSelect} />
      ),
      [onEmojiSelect],
    );

    return (
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={(e) => {
          const index = e.nativeEvent.position;
          const newCategory = categories[index].id;
          setSelectedCategory(newCategory);
        }}
      >
        {allCategoryEmojis.map((categoryData) => (
          <View key={categoryData.categoryId} style={{ flex: 1 }}>
            <FlatList
              removeClippedSubviews={true}
              maxToRenderPerBatch={12}
              windowSize={3}
              initialNumToRender={18}
              getItemLayout={getItemLayout}
              data={categoryData.emojis}
              numColumns={6}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
            />
          </View>
        ))}
      </PagerView>
    );
  },
);
ReactionList.displayName = 'ReactionList';

const ReactionPicker: React.FC<ReactionPickerProps> = ({ isVisible, onClose, onEmojiSelect }) => {
  const [selectedCategory, setSelectedCategory] = useState('people');
  const pagerRef = useRef<PagerView>(null);

  return (
    <Modal visible={isVisible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        className="flex-1 bg-black/50 justify-center items-center"
        onPress={onClose}
        activeOpacity={1}
      >
        <View className="bg-white rounded-2xl w-[80%] h-[60%]">
          {/* 头部 */}
          <View className="flex-row justify-between items-center p-4">
            <Text className="text-lg font-semibold">选择表情</Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-blue-500">关闭</Text>
            </TouchableOpacity>
          </View>

          {/* 分类标签 */}
          <View className="relative mb-2">
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={categories}
              className="px-2"
              renderItem={({ item: category, index }) => (
                <Pressable
                  onPress={() => {
                    setSelectedCategory(category.id);
                    pagerRef.current?.setPage(index);
                  }}
                  className="px-4 py-2 mx-1 rounded-full"
                  style={{
                    backgroundColor:
                      selectedCategory === category.id ? 'rgba(0, 0, 0, 0.1)' : 'transparent',
                  }}
                >
                  <Text>{categoryNames[category.id] || category.id}</Text>
                </Pressable>
              )}
              keyExtractor={(item) => item.id}
            />
          </View>

          <ReactionList
            pagerRef={pagerRef}
            setSelectedCategory={setSelectedCategory}
            onEmojiSelect={onEmojiSelect}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default ReactionPicker;
